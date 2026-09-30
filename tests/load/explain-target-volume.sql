-- Capture only after seed-target-volume.sql completes in the disposable project.
-- Store the query plan output with the load-test run and compare rows/buffers.
explain (analyze, buffers, format text)
select id, student_register_id, payment_date, invoice, amount
from public.payments
where (payment_date, id) < (current_date - 30, 'RCPT-500000')
order by payment_date desc, id desc
limit 51;

explain (analyze, buffers, format text)
select id, table_name, record_id, action, changed_at
from public.audit_log
where (changed_at, id) < (now() - interval '1 day', 500000)
order by changed_at desc, id desc
limit 51;

explain (analyze, buffers, format text)
select id, student_id, course_id, session_date, status
from public.attendance
where course_id = 'load-test-course-01'
  and (session_date, id) < (current_date - 10, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
order by session_date desc, id desc
limit 51;

explain (analyze, buffers, format text)
select id, student_id, course_id, session_date, status
from public.attendance
where (session_date, id) < (current_date - 10, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
order by session_date desc, id desc
limit 51;
