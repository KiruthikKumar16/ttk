-- Brand settings singleton table for editable institute brand information
create table if not exists public.brand_settings (
  id text primary key default 'default',
  display_name text not null default 'ThoorigAI Infotech',
  legal_name text not null default 'ThoorigAI Infotech LLP',
  short_name text not null default 'ThoorigAI',
  tagline text not null default 'Professional Learning & Training',
  support_email text not null default 'support@thoorigai.in',
  website_url text not null default 'http://localhost:3000',
  verify_base_url text not null default 'https://ttk-lemon.vercel.app',
  invoice_prefix text not null default 'TAI',
  updated_at timestamptz not null default now()
);

insert into public.brand_settings (
  id, display_name, legal_name, short_name, tagline, support_email, website_url, verify_base_url, invoice_prefix
) values (
  'default',
  'ThoorigAI Infotech',
  'ThoorigAI Infotech LLP',
  'ThoorigAI',
  'Professional Learning & Training',
  'support@thoorigai.in',
  'http://localhost:3000',
  'https://ttk-lemon.vercel.app',
  'TAI'
) on conflict (id) do nothing;

alter table public.brand_settings enable row level security;

drop policy if exists "authenticated can read brand" on public.brand_settings;
create policy "authenticated can read brand" on public.brand_settings for select to authenticated using (true);

drop policy if exists "admin can update brand" on public.brand_settings;
create policy "admin can update brand" on public.brand_settings for update to authenticated using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "admin can insert brand" on public.brand_settings;
create policy "admin can insert brand" on public.brand_settings for insert to authenticated with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

grant select, insert, update on public.brand_settings to authenticated;
grant all on public.brand_settings to service_role;
