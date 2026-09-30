-- ══════════════════════════════════════════════════════════════════════════
-- Migration: Consolidate 'trainer' role into 'staff'
-- 1. Migrate existing 'trainer' profiles to 'staff'
-- 2. Restrict profiles_role_check to ('admin', 'staff', 'pending')
-- 3. Update handle_new_user trigger function
-- 4. Update admin_change_profile_role function
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Migrate any existing trainer profile to staff
update public.profiles set role = 'staff' where role = 'trainer';

-- 2. Update table check constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'staff', 'pending'));

-- 3. Update handle_new_user() trigger function
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
  v_raw_role := new.raw_app_meta_data->>'role';

  if v_raw_role in ('admin', 'staff') then
    v_role := v_raw_role;
  else
    v_role := 'pending';
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = case when public.profiles.role = 'pending' and v_raw_role in ('admin', 'staff') then v_raw_role else public.profiles.role end;

  return new;
end;
$$;

alter function public.handle_new_user() security definer;
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- 4. Update admin_change_profile_role function
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
  if p_role not in ('admin', 'staff', 'pending') then
    raise exception using errcode = '22023', message = 'Invalid profile role. Allowed: admin, staff, pending';
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

  if v_old_role = p_role then
    return;
  end if;

  update public.profiles set role = p_role where id = p_user_id;

  insert into public.audit_logs (actor_id, action, target_type, target_id, old_values, new_values)
  values (
    v_actor,
    'change_role',
    'profile',
    p_user_id,
    pg_catalog.jsonb_build_object('role', v_old_role),
    pg_catalog.jsonb_build_object('role', p_role)
  );
end;
$function$;

alter function public.admin_change_profile_role(uuid, text) security definer;
alter function public.admin_change_profile_role(uuid, text) set search_path = '';
revoke all on function public.admin_change_profile_role(uuid, text) from public, anon;
grant execute on function public.admin_change_profile_role(uuid, text) to authenticated;
