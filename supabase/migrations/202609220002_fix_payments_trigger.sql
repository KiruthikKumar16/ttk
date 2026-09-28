-- Migration 0006: Fix race condition in payments trigger by using row-level locking and relative updates

-- ══════════════════════════════════════════════════════════════════════════
--  1. Fix payments trigger function to prevent lost updates under concurrency
-- ═════════════════════════════════════════════════════════════════════════
--
-- The original trigger function had a race condition where concurrent inserts for
-- the same student could lose updates because:
--   1. It read total/paid without locking the student row
--   2. It computed a new paid value in the application layer (v_paid := v_paid + NEW.amount)
--   3. It then set paid to this absolute value (paid = v_paid)
--
-- Under concurrency, Transaction A and B could both read the same initial paid
-- value, compute their own new paid values, and then overwrite each other's
-- updates when setting paid to their respective absolute values.
--
-- This fix addresses both issues:
--   1. Uses SELECT ... FOR UPDATE to lock the student row during the transaction,
--      serializing concurrent inserts for the same student.
--   2. Updates paid using a relative increment (paid = paid + NEW.amount) so
--      each transaction builds on the latest committed value.
--
-- The overpayment check and status derivation logic remain unchanged.

-- Drop the existing trigger and function if they exist to avoid conflicts
drop trigger if exists _100_sync_student on public.payments;
drop function if exists public.tg__payments__sync_student();

-- Create the new trigger function with row locking and relative update
create or replace function public.tg__payments__sync_student()
returns trigger language plpgsql as $$
declare
  v_total   numeric(12,2);
  v_paid    numeric(12,2);
begin
  -- Lock the student row to prevent concurrent updates for the same student.
  -- This ensures that only one transaction at a time can read and update
  -- the student's payment information, preventing lost updates.
  select total, paid
    into strict v_total, v_paid
    from public.students
   where id = NEW.student_id
   for update;  -- Row-level lock held until end of transaction

  -- Reject overpayment: check if the new payment exceeds the remaining balance
  -- using the currently locked values (which are guaranteed to be up-to-date)
  if NEW.amount > (v_total - v_paid) then
    raise exception 'Payment amount % exceeds remaining balance of %',
      NEW.amount, (v_total - v_paid);
  end if;

  -- Update the student's paid amount using a relative increment.
  -- This ensures we never lose updates because we're always adding to the
  -- latest committed paid value (rather than setting an absolute value based
  -- on potentially stale data).
  update public.students
     set paid      = paid + NEW.amount,
         status    = case when paid + NEW.amount >= total then 'Fully Paid' else 'Pending' end,
         updated_at = now()
   where id = NEW.student_id;

  return NEW;
end $$;

-- Recreate the trigger to use the updated function
create trigger _100_sync_student
before insert on public.payments
for each row execute function public.tg__payments__sync_student();