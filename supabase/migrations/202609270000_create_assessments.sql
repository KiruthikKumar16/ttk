-- Migration 0011: Create assessments and assessment_results tables

-- ═════════════════════════════════════════════════════════════════════════════════
--  1. Create assessments table
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  max_score numeric not null check (max_score >= 0),
  assessment_date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.assessments enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════════
--  2. Create assessment_results table
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric not null check (score >= 0),
  remarks text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz default now(),
  unique(assessment_id, student_id)
);

-- Enable Row Level Security
alter table public.assessment_results enable row level security;
grant select, insert, update, delete on public.assessments, public.assessment_results to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
--  3. Create policies for assessments
-- ═══════════════════════════════════════════════════════════════════════════════
-- Allow staff, admin, and trainer to insert assessments
create policy "Staff, admin, and trainer can create assessments"
  on public.assessments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow staff, admin, and trainer to select assessments
create policy "Staff, admin, and trainer can view assessments"
  on public.assessments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- No updates or deletes on assessments (immutable once created, but we can adjust if needed)
-- For now, we allow updates and deletes by the same roles, but note: this might affect historical data.
-- Alternatively, we can restrict to only inserts and selects, and update/delete via a separate process.
-- Let's allow updates and deletes for the same roles for simplicity, but note the caveat.
create policy "Staff, admin, and trainer can update assessments"
  on public.assessments for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

create policy "Staff, admin, and trainer can delete assessments"
  on public.assessments for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
--  4. Create policies for assessment_results
-- ═══════════════════════════════════════════════════════════════════════════════
-- Allow staff, admin, and trainer to insert assessment results
create policy "Staff, admin, and trainer can create assessment results"
  on public.assessment_results for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow staff, admin, and trainer to select assessment results
create policy "Staff, admin, and trainer can view assessment results"
  on public.assessment_results for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow staff, admin, and trainer to update assessment results
create policy "Staff, admin, and trainer can update assessment results"
  on public.assessment_results for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow staff, admin, and trainer to delete assessment results
create policy "Staff, admin, and trainer can delete assessment results"
  on public.assessment_results for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
--  5. Create trigger function to validate score <= max_score
-- ═══════════════════════════════════════════════════════════════════════════════
create or replace function public.validate_assessment_score()
returns trigger as $$
begin
  -- Check if the score is greater than the max_score of the associated assessment
  if exists (
    select 1 from public.assessments
    where id = new.assessment_id
      and max_score < new.score
  ) then
    raise exception 'Score cannot exceed the maximum score for the assessment (%).',
      (select max_score from public.assessments where id = new.assessment_id);
  end if;

  return new;
end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
--  6. Create trigger for assessment_results
-- ═══════════════════════════════════════════════════════════════════════════════
create trigger validate_assessment_score_trigger
  before insert or update on public.assessment_results
  for each row
  execute function public.validate_assessment_score();
