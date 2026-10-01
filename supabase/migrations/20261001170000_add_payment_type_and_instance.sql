-- Add payment_type and instance_number to public.payments
alter table public.payments
  add column if not exists payment_type text,
  add column if not exists instance_number integer;

create index if not exists payments_payment_type_idx
  on public.payments (payment_type);

create index if not exists payments_instance_number_idx
  on public.payments (instance_number);

-- Backfill existing payments with instance_number and payment_type
with ranked_payments as (
  select
    id,
    row_number() over (
      partition by student_id
      order by payment_date asc, created_at asc
    ) as calc_instance,
    count(*) over (
      partition by student_id
    ) as total_payments
  from public.payments
)
update public.payments p
set
  instance_number = coalesce(p.instance_number, r.calc_instance),
  payment_type = coalesce(
    p.payment_type,
    case
      when r.calc_instance = 1 and r.total_payments = 1 and exists (
        select 1 from public.students s where s.id = p.student_id and s.paid >= s.total
      ) then 'Full Course Fees Payment'
      when r.calc_instance = 1 then '1st Part Fees Payment'
      when r.calc_instance = 2 then '2nd Part Fees Payment'
      when r.calc_instance = 3 then '3rd Part Fees Payment'
      when r.calc_instance = 4 then '4th Part Fees Payment'
      else concat(r.calc_instance, 'th Part Fees Payment')
    end
  )
from ranked_payments r
where p.id = r.id;
