-- Migration: Add user contact details and metadata to profiles
-- Allows users and administrators to store contact details and custom metadata.

-- 1. Add contact_details and metadata JSONB columns to profiles table
alter table public.profiles
  add column if not exists contact_details jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 2. Create trigger function to ensure non-admin users cannot escalate or change their role
create or replace function public.check_profile_role_unchanged()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and old.role is distinct from new.role and not (select public.is_current_user_admin()) then
    raise exception 'Non-admin users cannot modify their role' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_prevent_self_role_change on public.profiles;
create trigger tr_prevent_self_role_change
  before update on public.profiles
  for each row
  execute function public.check_profile_role_unchanged();

-- 3. RLS policy to allow users to update their own profile (name, contact details, metadata)
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
