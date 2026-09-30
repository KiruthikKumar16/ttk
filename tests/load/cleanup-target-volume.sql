-- Deletes only the synthetic rows created by seed-target-volume.sql.
-- Run this only in the disposable load-test Supabase project.
begin;
alter table public.students disable trigger audit_students_trigger;
alter table public.payments disable trigger audit_payments_trigger;

delete from public.attendance
where course_id like 'load-test-course-%';

delete from public.payments
where student_id in (select id from public.students where phone like 'LOADTEST-%');

delete from public.students where phone like 'LOADTEST-%';
delete from public.courses where id like 'load-test-course-%';

alter table public.payments enable trigger audit_payments_trigger;
alter table public.students enable trigger audit_students_trigger;
commit;
