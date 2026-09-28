-- Convert persisted monetary values from rupees with decimals to integer paise.
-- Existing values are multiplied by 100 before changing the column types.

alter table public.payments drop column if exists grand_total;

alter table public.students
  alter column total type bigint using round(total * 100)::bigint,
  alter column paid type bigint using round(paid * 100)::bigint;

alter table public.courses
  alter column fee type bigint using round(fee * 100)::bigint;

alter table public.payments
  alter column amount type bigint using round(amount * 100)::bigint,
  alter column cgst type bigint using round(cgst * 100)::bigint,
  alter column sgst type bigint using round(sgst * 100)::bigint;

alter table public.payments
  add column grand_total bigint generated always as (amount + cgst + sgst) stored;

create or replace function public.tg__payments__sync_student()
returns trigger language plpgsql as $$
declare
  v_total bigint;
  v_paid bigint;
begin
  select total, paid
    into strict v_total, v_paid
    from public.students
   where id = NEW.student_id
   for update;

  if NEW.amount > (v_total - v_paid) then
    raise exception 'Payment amount % exceeds remaining balance of %',
      NEW.amount, (v_total - v_paid);
  end if;

  update public.students
     set paid = paid + NEW.amount,
         status = case when paid + NEW.amount >= total then 'Fully Paid' else 'Pending' end,
         updated_at = now()
   where id = NEW.student_id;

  return NEW;
end $$;

comment on column public.students.total is 'Course fee in integer paise.';
comment on column public.students.paid is 'Amount paid in integer paise.';
comment on column public.courses.fee is 'Course fee in integer paise.';
comment on column public.payments.amount is 'Payment base amount in integer paise.';
comment on column public.payments.cgst is 'CGST amount in integer paise.';
comment on column public.payments.sgst is 'SGST amount in integer paise.';
comment on column public.payments.grand_total is 'Payment total in integer paise.';
