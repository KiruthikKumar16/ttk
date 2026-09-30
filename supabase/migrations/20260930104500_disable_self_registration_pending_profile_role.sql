-- ══════════════════════════════════════════════════════════════════════════
-- Migration: Prevent Self-Registration Privilege Escalation
-- 1. Allow 'pending' role in profiles table and make 'pending' the default
-- 2. Default all new auth users to 'pending' with 0 permissions
-- 3. Only accept active roles if explicitly set via admin app_metadata
-- 4. Allow admin_change_profile_role to manage 'pending' status
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Update profiles table constraint & default
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'staff', 'trainer', 'pending'));
alter table public.profiles alter column role set default 'pending';

-- 2. Update handle_new_user() trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_raw_role text;
begin
  -- Extract role from app_metadata (trusted; only writable via service_role / Supabase Admin API)
  v_raw_role := new.raw_app_meta_data->>'role';

  if v_raw_role in ('admin', 'staff', 'trainer') then
    v_role := v_raw_role;
  else
    v_role := 'pending';
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

alter function public.handle_new_user() security definer;
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- 3. Update admin_change_profile_role to allow transitioning to/from 'pending'
create or replace function public.admin_change_profile_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_old_role text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if p_role not in ('admin', 'staff', 'trainer', 'pending') then
    raise exception using errcode = '22023', message = 'Invalid profile role';
  end if;
  if p_user_id = v_actor then
    raise exception using errcode = '22023', message = 'You cannot change your own role';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin-profile-role-change'));
  if not exists (select 1 from public.profiles where id = v_actor and role = 'admin') then
    raise exception using errcode = '42501', message = 'Admin access is required';
  end if;

  select role into v_old_role from public.profiles where id = p_user_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;
  if v_old_role = p_role then return; end if;
  if v_old_role = 'admin' and p_role <> 'admin'
    and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception using errcode = '23514', message = 'At least one admin account must remain';
  end if;

  update public.profiles set role = p_role where id = p_user_id;
  insert into public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  values ('profiles', p_user_id, 'update', v_actor,
    pg_catalog.jsonb_build_object('role', v_old_role),
    pg_catalog.jsonb_build_object('role', p_role));
end;
$function$;

alter function public.admin_change_profile_role(uuid, text) security definer;
alter function public.admin_change_profile_role(uuid, text) set search_path = '';
revoke all on function public.admin_change_profile_role(uuid, text) from public, anon;
grant execute on function public.admin_change_profile_role(uuid, text) to authenticated;
