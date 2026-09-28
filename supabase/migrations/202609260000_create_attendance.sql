-- Migration 0010: Create attendance table for tracking student attendance

-- ═════════════════════════════════════════════════════════════════════════════════
--  1. Create attendance table
-- ══════════════════════════════════════════════════════════════════════════════
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  session_date date not null,
  status text not null check (status in ('Present', 'Absent', 'Late', 'Excused')),
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(student_id, course_id, session_date)
);

-- Enable Row Level Security
alter table public.attendance enable row level security;
grant select, insert, update on public.attendance to authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
--  2. Create policies for attendance
-- ══════════════════════════════════════════════════════════════════════════════
-- Allow staff and admin to insert and select attendance records
create policy "Staff and admin can manage attendance"
  on public.attendance for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow staff and admin to select attendance records
create policy "Staff and admin can view attendance"
  on public.attendance for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow trainers to insert and select attendance for their courses
-- Note: Following up on course-assignment concept - for now allowing all trainers
-- TODO: Once course ownership/assignment exists, replace with:
-- exists (select 1 from public.course_instructors where course_id = attendance.course_id and profile_id = auth.uid())
create policy "Trainers can manage attendance for their courses"
  on public.attendance for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Allow trainers to select attendance for their courses
create policy "Trainers can view attendance for their courses"
  on public.attendance for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Upserts require UPDATE permission and an UPDATE policy for conflict rows.
create policy "Staff, admin, and trainer can update attendance"
  on public.attendance for update
  to authenticated
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

-- Attendance can be corrected through the role-checked policy above; deletes stay disabled.
create policy "No updates or deletes on attendance"
  on public.attendance for delete
  using (false);
