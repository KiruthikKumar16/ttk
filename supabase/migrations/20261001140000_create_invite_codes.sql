-- ══════════════════════════════════════════════════════════════════════════
-- Migration: One-Time Expiring Staff & Admin Invite Codes
-- 1. Create invite_codes table with expiration and one-time use flags
-- 2. Add RLS policies for administrator management
-- 3. Create atomic redeem_invite_code RPC
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  role text not null check (role in ('staff', 'admin')),
  created_by uuid references auth.users(id) on delete set null,
  recipient_email text,
  expires_at timestamptz not null,
  is_used boolean not null default false,
  used_by_user_id uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for fast lookup on unconsumed codes
create index if not exists invite_codes_code_lookup_idx
  on public.invite_codes (upper(trim(code)))
  where is_used = false;

create index if not exists invite_codes_created_at_idx
  on public.invite_codes (created_at desc);

-- Enable RLS
alter table public.invite_codes enable row level security;

-- Only admins can manage invite codes
create policy "Admins can view invite codes"
  on public.invite_codes for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

create policy "Admins can create invite codes"
  on public.invite_codes for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

create policy "Admins can update invite codes"
  on public.invite_codes for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

create policy "Admins can delete invite codes"
  on public.invite_codes for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

-- Atomic redemption function (security definer with strict search path)
create or replace function public.redeem_invite_code(
  p_code text,
  p_user_id uuid,
  p_email text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite record;
begin
  if p_code is null or trim(p_code) = '' then
    raise exception using errcode = '22023', message = 'Invite code is required.';
  end if;

  select * into v_invite
  from public.invite_codes
  where upper(trim(code)) = upper(trim(p_code))
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Invalid invite code.';
  end if;

  if v_invite.is_used then
    raise exception using errcode = '22023', message = 'This invite code has already been redeemed.';
  end if;

  if v_invite.expires_at < now() then
    raise exception using errcode = '22023', message = 'This invite code has expired.';
  end if;

  if v_invite.recipient_email is not null and trim(v_invite.recipient_email) <> '' then
    if lower(trim(v_invite.recipient_email)) <> lower(trim(p_email)) then
      raise exception using errcode = '22023', message = 'This invite code is reserved for another email address.';
    end if;
  end if;

  update public.invite_codes
  set is_used = true,
      used_by_user_id = p_user_id,
      used_at = now()
  where id = v_invite.id;

  return v_invite.role;
end;
$$;

alter function public.redeem_invite_code(text, uuid, text) security definer;
alter function public.redeem_invite_code(text, uuid, text) set search_path = '';
revoke all on function public.redeem_invite_code(text, uuid, text) from public;
grant execute on function public.redeem_invite_code(text, uuid, text) to anon, authenticated, service_role;
