-- Synthetic target-volume data for an isolated, disposable Supabase project only.
-- Run the entire file in one transaction. Never run against production or real student data.
begin;

do $$
begin
  if exists (select 1 from public.students where phone like 'LOADTEST-%')
     or exists (select 1 from public.courses where id like 'load-test-course-%') then
    raise exception 'Load-test fixtures already exist; clean the disposable database before reseeding.';
  end if;
end;
$$;

create temporary table _loadtest_students (
  id uuid not null,
  register_id integer not null,
  course_id text not null
) on commit drop;

insert into public.courses (id, name, fee, duration, description, gst_inclusive)
select
  'load-test-course-' || lpad(n::text, 2, '0'),
  'Load Test Course ' || n,
  1000000,
  'Synthetic fixture',
  'Disposable scale-test course fixture',
  false
from generate_series(1, 10) as n
on conflict (id) do nothing;

-- The production audit and payment aggregation triggers add unnecessary write
-- amplification to synthetic seed generation. The source rows already carry
-- consistent paid/status values, and these triggers are restored before commit.
alter table public.students disable trigger audit_students_trigger;
alter table public.payments disable trigger audit_payments_trigger;

with source as (
  select n,
         'load-test-course-' || lpad((((n - 1) % 10) + 1)::text, 2, '0') as course_id
  from generate_series(1, 100000) as n
), inserted as (
  insert into public.students (
    name, course, batch, total, paid, phone, status
  )
  select
    'Synthetic Student ' || source.n,
    courses.name,
    'LOADTEST',
    1000000,
    1000000,
    'LOADTEST-' || lpad(source.n::text, 6, '0'),
    'Fully Paid'
  from source
  join public.courses on courses.id = source.course_id
  returning id, register_id, course
)
insert into _loadtest_students (id, register_id, course_id)
select inserted.id, inserted.register_id, courses.id
from inserted
join public.courses on courses.name = inserted.course;

-- Exactly 10 payments per synthetic student: 1,000,000 payment rows.
insert into public.payments (
  student_id, student_register_id, method, amount, invoice, payment_date
)
select
  students.id,
  students.register_id,
  'Load test',
  100000,
  'LOADTEST-PLACEHOLDER',
  current_date - ((payment_number - 1) % 365)
from _loadtest_students as students
cross join generate_series(1, 10) as payment_number;

-- Exactly 50 sessions per synthetic student: 5,000,000 attendance rows.
insert into public.attendance (student_id, course_id, session_date, status)
select
  students.id,
  students.course_id,
  current_date - (session_number - 1),
  case ((students.register_id + session_number) % 4)
    when 0 then 'Present'
    when 1 then 'Absent'
    when 2 then 'Late'
    else 'Excused'
  end
from _loadtest_students as students
cross join generate_series(1, 50) as session_number;

alter table public.students enable trigger audit_students_trigger;
alter table public.payments enable trigger audit_payments_trigger;

commit;
