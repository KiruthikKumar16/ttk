-- Migration 0008: Create sequences for generated IDs and set defaults

-- ═══════════════════════════════════════════════════════════════════════════
--  1. Create sequence for student registerId
-- ═══════════════════════════════════════════════════════════════════════════
-- Find the maximum existing registerId to start the sequence after it
DO $$
DECLARE
  max_reg_id integer;
BEGIN
  SELECT COALESCE(MAX(register_id), 0) INTO max_reg_id FROM public.students;
  IF max_reg_id < 1000 THEN
    -- If the max is less than 1000, start at 1000 to match the mock data pattern
    max_reg_id := 999;
  END IF;
  EXECUTE 'CREATE SEQUENCE IF NOT EXISTS public.students_register_id_seq START ' || (max_reg_id + 1) || ' INCREMENT 1';
END $$;

-- Alter the students table to use the sequence as default for registerId
ALTER TABLE public.students
  ALTER COLUMN register_id SET DEFAULT nextval('public.students_register_id_seq');

-- ═══════════════════════════════════════════════════════════════════════════
--  2. Create sequence for payment numeric part and set default for payment id
-- ═══════════════════════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS public.payment_id_seq START 1 INCREMENT 1;

-- We'll use a BEFORE INSERT trigger to set the payment id
-- First, create a function to generate the payment id
CREATE OR REPLACE FUNCTION public.generate_payment_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.id := 'RCPT-' || nextval('public.payment_id_seq')::TEXT;
  RETURN NEW;
END $$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS set_payment_id ON public.payments;
CREATE TRIGGER set_payment_id
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.generate_payment_id();

-- ═══════════════════════════════════════════════════════════════════════════
--  3. Create sequence for invoice numeric part and set default for invoice
-- ═══════════════════════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1 INCREMENT 1;

GRANT USAGE, SELECT ON SEQUENCE
  public.students_register_id_seq,
  public.payment_id_seq,
  public.invoice_seq
TO authenticated;

-- We'll use a BEFORE INSERT trigger to set the invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Format: TAI/YYYY/INVxxxxxx where xxxxxx is the sequence number padded to 6 digits
  NEW.invoice := 'TAI/' || to_char(CURRENT_DATE, 'YYYY') || '/INV' || lpad(nextval('public.invoice_seq')::TEXT, 6, '0');
  RETURN NEW;
END $$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS set_invoice_number ON public.payments;
CREATE TRIGGER set_invoice_number
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- Note: The above two triggers on payments will both fire. We can combine them into one trigger
-- but for clarity we keep them separate. They set different columns.

-- ═══════════════════════════════════════════════════════════════════════════
--  4. Update existing rows to have values if they are null (optional, but good practice)
-- ═══════════════════════════════════════════════════════════════════════════
-- For students, if register_id is null, set it from the sequence (though it should have a default now)
UPDATE public.students SET register_id = nextval('public.students_register_id_seq') WHERE register_id IS NULL;

-- For payments, if id is null, set it (though the trigger will set it on insert, existing rows might be null)
UPDATE public.payments SET id = 'RCPT-' || nextval('public.payment_id_seq')::TEXT WHERE id IS NULL;
-- For payments, if invoice is null, set it
UPDATE public.payments SET invoice = 'TAI/' || to_char(CURRENT_DATE, 'YYYY') || '/INV' || lpad(nextval('public.invoice_seq')::TEXT, 6, '0') WHERE invoice IS NULL;
