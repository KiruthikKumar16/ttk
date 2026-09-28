-- Migration 0004: Create profiles table and trigger for automatic profile creation

-- ══════════════════════════════════════════════════════════════════════════
--  1. Create profiles table
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'staff' check (role in ('admin', 'staff', 'trainer')),
  full_name text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

-- ══════════════════════════════════════════════════════════════════════════
--  2. Create policies for profiles
-- ═════════════════════════════════════════════════════════════════════════
-- Users can view their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can insert and update profiles (including roles) of any user
create policy "Admins can manage profiles"
  on public.profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
--  3. Create trigger to automatically create a profile when a new auth.user is created
-- ══════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql as $$
begin
  -- Insert a new profile for the user with default role 'staff'
  insert into public.profiles (id, role, full_name)
  values (new.id, 'staff', new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing; -- in case it already exists

  return new;
end $$;

-- Drop the trigger if it exists and recreate it
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
