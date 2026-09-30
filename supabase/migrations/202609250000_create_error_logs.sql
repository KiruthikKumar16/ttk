-- Migration 0009: Create error_logs table for capturing server-side errors

-- ═══════════════════════════════════════════════════════════════════════════
--  1. Create error_logs table
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.error_logs (
  id bigserial primary key,
  message text not null,
  stack text,
  context jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security (we'll allow inserts from service role only via policy)
alter table public.error_logs enable row level security;
grant insert, select on public.error_logs to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
--  2. Create policies for error_logs
-- ═══════════════════════════════════════════════════════════════════════════
-- Allow inserts from service role (anon key with service role bypass) or authenticated users
create policy "Allow inserts for error logging"
  on public.error_logs for insert
  to authenticated
  with check (false);

-- Allow selects only for admins (optional, for viewing logs)
create policy "Admins can view error logs"
  on public.error_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policies can target one command each. Keep error logs immutable.
create policy "No updates on error log"
  on public.error_logs for update
  using (false)
  with check (false);

create policy "No deletes on error log"
  on public.error_logs for delete
  using (false);
