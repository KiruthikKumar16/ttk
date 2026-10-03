-- Migration: Comprehensive Audit Logging
-- - Mandate full_name on profiles
-- - Extend audit trigger to cover all tables
-- - Attach trigger to all core domain tables

-- 1. Mandate full_name on profiles
update public.profiles set full_name = 'Unknown User' where full_name is null;
alter table public.profiles alter column full_name set not null;

-- 2. Rewrite audit trigger function to be generic and log everything
create or replace function public.audit_log_trigger_function()
returns trigger language plpgsql security definer as $$
begin
  insert into public.audit_log (
    table_name, record_id, action, changed_by, old_values, new_values
  ) values (
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    lower(tg_op),
    case when current_setting('request.jwt.claims', true) = '' then null
         else (current_setting('request.jwt.claims', true))::jsonb ->> 'sub' end::uuid,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return null;
end $$;

-- 3. Drop existing triggers
drop trigger if exists audit_payments_trigger on public.payments;
drop trigger if exists audit_students_trigger on public.students;

-- 4. Create trigger generation macro
do $$
declare
  t text;
  tables text[] := array[
    'profiles',
    'students',
    'payments',
    'attendance',
    'assessments',
    'course_materials',
    'verifiable_documents',
    'course_categories',
    'courses',
    'brand_settings',
    'invite_codes',
    'skill_tags',
    'notifications'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists audit_%I_trigger on public.%I', t, t);
    execute format('create trigger audit_%I_trigger after insert or update or delete on public.%I for each row execute function public.audit_log_trigger_function()', t, t);
  end loop;
end $$;
