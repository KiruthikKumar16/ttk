-- Correlate application audit rows with API request IDs from PostgREST headers.
-- Student IDs are UUIDs while payment IDs are text, so the audit key must support both.
alter table public.audit_log alter column record_id type text using record_id::text;
alter table public.audit_log add column request_id text;
comment on column public.audit_log.request_id is
  'Opaque x-request-id value attached by the API for tracing a database mutation without recording user input.';

create or replace function public.audit_log_trigger_function()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_headers text;
  correlated_request_id text;
  should_audit boolean := true;
begin
  request_headers := nullif(current_setting('request.headers', true), '');
  if request_headers is not null then
    begin
      correlated_request_id := nullif(request_headers::jsonb ->> 'x-request-id', '');
    exception when others then
      correlated_request_id := null;
    end;
  end if;

  if tg_table_name in ('payments', 'students') then
    if tg_table_name = 'students' and tg_op = 'UPDATE' then
      should_audit := old.paid is distinct from new.paid or old.status is distinct from new.status;
    end if;
    if should_audit then
      insert into public.audit_log (
        table_name, record_id, action, changed_by, old_values, new_values, request_id
      ) values (
        tg_table_name,
        case when tg_op = 'DELETE' then old.id::text else new.id::text end,
        lower(tg_op),
        case when nullif(current_setting('request.jwt.claims', true), '') is null then null
             else (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid end,
        case when tg_op = 'INSERT' then null else to_jsonb(old) end,
        case when tg_op = 'DELETE' then null else to_jsonb(new) end,
        correlated_request_id
      );
    end if;
  end if;

  return null;
end;
$$;
comment on function public.audit_log_trigger_function() is
  'Audits payment and student changes and attaches the request ID propagated by PostgREST when available.';

create or replace function public.get_app_readiness(p_expected_migration text)
returns table(migration_matches boolean, current_migration text)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(m.version::text) = p_expected_migration, false), max(m.version::text)
  from supabase_migrations.schema_migrations as m;
$$;
comment on function public.get_app_readiness(text) is
  'Returns the latest applied migration version for the server-only readiness probe.';
revoke all on function public.get_app_readiness(text) from public, anon, authenticated;
grant execute on function public.get_app_readiness(text) to service_role;

-- Sentry is the canonical error store. Avoid retaining a second, unmanaged copy in Postgres.
drop table if exists public.error_logs;
