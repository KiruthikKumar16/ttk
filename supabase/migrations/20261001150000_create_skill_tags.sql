-- Migration: Skill Tags table for Admin CRUD configuration
create table if not exists public.skill_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.skill_tags enable row level security;

drop policy if exists "Anyone authenticated can read skill tags" on public.skill_tags;
create policy "Anyone authenticated can read skill tags"
  on public.skill_tags
  for select
  to authenticated, anon
  using (true);

drop policy if exists "Admins can manage skill tags" on public.skill_tags;
create policy "Admins can manage skill tags"
  on public.skill_tags
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

grant select on public.skill_tags to authenticated, anon;
grant insert, update, delete on public.skill_tags to authenticated;
grant all on public.skill_tags to service_role;

-- Seed default skills in neat display order
insert into public.skill_tags (name, sort_order)
values
  ('Python', 1),
  ('Web Dev', 2),
  ('React', 3),
  ('AI/ML', 4),
  ('Full Stack', 5),
  ('UI/UX', 6),
  ('Internship', 7),
  ('College Student', 8),
  ('Job Seeker', 9),
  ('Beginner', 10)
on conflict (name) do nothing;
