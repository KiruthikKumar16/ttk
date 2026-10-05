-- ══════════════════════════════════════════════════════════════════════════
-- Migration: Fix service_role profile role update triggers & sync accounts
-- 1. Update is_current_user_admin() to allow service_role and internal superusers
-- 2. Update check_profile_role_unchanged() to allow service_role updates
-- 3. Update handle_new_user() trigger function
-- 4. Synchronize profiles for users with admin app_metadata (e.g. moonninjak)
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Allow service_role in is_current_user_admin()
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (
    (select auth.role()) = 'service_role'
    or (select auth.jwt() ->> 'role') = 'service_role'
    or current_user in ('postgres', 'service_role', 'supabase_admin')
    or exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
  );
$function$;

-- 2. Update check_profile_role_unchanged trigger function
create or replace function public.check_profile_role_unchanged()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jwt_role text;
begin
  -- Explicitly allow service_role, internal processes, and database superusers
  v_jwt_role := (select auth.jwt() ->> 'role');
  if v_jwt_role = 'service_role'
     or (select auth.role()) = 'service_role'
     or current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- Block non-admin authenticated users from modifying their role
  if (select auth.uid()) is not null
     and old.role is distinct from new.role
     and not (select public.is_current_user_admin()) then
    raise exception 'Non-admin users cannot modify their role' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- 3. Update handle_new_user trigger function
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
  values (new.id, v_role, coalesce(new.raw_user_meta_data->>'full_name', 'New User'))
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = case
      when public.profiles.role = 'pending' and v_raw_role in ('admin', 'staff') then v_raw_role
      else public.profiles.role
    end;

  return new;
end;
$$;

-- 4. Sync profiles whose role was blocked by trigger from their admin invite code
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and u.raw_app_meta_data->>'role' = 'admin'
  and p.role <> 'admin';
