begin;
select plan(10);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.attendance'::regclass),
  'row level security is enabled for attendance'
);

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.attendance'::regclass and contype = 'u'
    and conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.attendance'::regclass and attname = 'student_id'),
      (select attnum from pg_attribute where attrelid = 'public.attendance'::regclass and attname = 'course_id'),
      (select attnum from pg_attribute where attrelid = 'public.attendance'::regclass and attname = 'session_date')
    ]::smallint[]),
  'attendance has a unique student, course, and date constraint'
);

select ok(exists (select 1 from pg_class where relkind = 'S' and oid = 'public.invoice_seq'::regclass), 'invoice sequence exists');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.payments'::regclass and tgname = 'set_invoice_number' and not tgisinternal), 'payment insert assigns invoice numbers');

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'audit_log' and cmd = 'UPDATE' and qual = 'false'),
  1,
  'audit log update policy denies all rows'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'audit_log' and cmd = 'DELETE' and qual = 'false'),
  1,
  'audit log delete policy denies all rows'
);
select is(
  (select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and table_name = 'audit_log' and grantee = 'authenticated' and privilege_type = 'INSERT'),
  0,
  'authenticated users cannot insert audit rows directly'
);

select ok(
  has_table_privilege('service_role', 'public.courses', 'SELECT'),
  'service_role can read the public course catalog for the shared server cache'
);
select ok(
  has_column_privilege('service_role', 'public.gst_settings', 'id', 'SELECT')
    and has_column_privilege('service_role', 'public.gst_settings', 'rate', 'SELECT')
    and has_column_privilege('service_role', 'public.gst_settings', 'enabled', 'SELECT'),
  'service_role can read only the GST cache lookup and calculation fields'
);
select ok(
  not has_column_privilege('service_role', 'public.gst_settings', 'gstin', 'SELECT'),
  'service_role cannot read GSTIN through the shared cache'
);

select * from finish();
rollback;
