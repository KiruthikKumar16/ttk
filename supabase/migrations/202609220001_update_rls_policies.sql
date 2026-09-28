-- Migration 0005: Update RLS policies for tables to use profiles.role

-- ══════════════════════════════════════════════════════════════════════════
--  1. Students table
-- ═════════════════════════════════════════════════════════════════════════
-- Drop existing policies on students (if any) and create new ones
drop policy if exists "Students select policy" on public.students;
drop policy if exists "Students insert policy" on public.students;
drop policy if exists "Students update policy" on public.students;
drop policy if exists "Students delete policy" on public.students;
drop policy if exists "authenticated users can read students" on public.students;
drop policy if exists "authenticated users can create students" on public.students;
drop policy if exists "authenticated users can update students" on public.students;

-- Allow SELECT for authenticated staff, admin, trainer
create policy "Students select policy"
  on public.students for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow INSERT for staff and admin only
create policy "Students insert policy"
  on public.students for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow UPDATE for staff and admin only (trainer cannot update students)
create policy "Students update policy"
  on public.students for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow DELETE for staff and admin only
create policy "Students delete policy"
  on public.students for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
--  2. Payments table
-- ═════════════════════════════════════════════════════════════════════════
-- Drop existing policies on payments (if any) and create new ones
drop policy if exists "Payments select policy" on public.payments;
drop policy if exists "Payments insert policy" on public.payments;
drop policy if exists "Payments update policy" on public.payments;
drop policy if exists "Payments delete policy" on public.payments;
drop policy if exists "authenticated users can read payments" on public.payments;
drop policy if exists "authenticated users can create payments" on public.payments;

-- Allow SELECT for authenticated staff, admin, trainer
create policy "Payments select policy"
  on public.payments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow INSERT for staff and admin only
create policy "Payments insert policy"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow UPDATE for staff and admin only
create policy "Payments update policy"
  on public.payments for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow DELETE for staff and admin only
create policy "Payments delete policy"
  on public.payments for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
--  3. Courses table
-- ═════════════════════════════════════════════════════════════════════════
-- Drop existing policies on courses (if any) and create new ones
drop policy if exists "Courses select policy" on public.courses;
drop policy if exists "Courses insert policy" on public.courses;
drop policy if exists "Courses update policy" on public.courses;
drop policy if exists "Courses delete policy" on public.courses;
drop policy if exists "authenticated can read courses" on public.courses;
drop policy if exists "authenticated can insert courses" on public.courses;
drop policy if exists "authenticated can update courses" on public.courses;
drop policy if exists "authenticated can delete courses" on public.courses;

-- Allow SELECT for authenticated staff, admin, trainer
create policy "Courses select policy"
  on public.courses for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow INSERT for staff and admin only
create policy "Courses insert policy"
  on public.courses for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow UPDATE for staff and admin only
create policy "Courses update policy"
  on public.courses for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow DELETE for admin only
create policy "Courses delete policy"
  on public.courses for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
--  4. Certificates table
-- ═════════════════════════════════════════════════════════════════════════
-- Drop existing policies on certificates (if any) and create new ones
drop policy if exists "Certificates select policy" on public.certificates;
drop policy if exists "Certificates insert policy" on public.certificates;
drop policy if exists "Certificates update policy" on public.certificates;
drop policy if exists "Certificates delete policy" on public.certificates;
drop policy if exists "authenticated can read certificates" on public.certificates;
drop policy if exists "authenticated can create certificates" on public.certificates;

-- Allow SELECT for authenticated staff, admin, trainer
create policy "Certificates select policy"
  on public.certificates for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow INSERT for staff and admin only
create policy "Certificates insert policy"
  on public.certificates for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow UPDATE for staff and admin only
create policy "Certificates update policy"
  on public.certificates for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow DELETE for staff and admin only
create policy "Certificates delete policy"
  on public.certificates for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
--  5. GST settings table (assuming it's called gst_settings)
-- ═════════════════════════════════════════════════════════════════════════
-- Drop existing policies on gst_settings (if any) and create new ones
drop policy if exists "GST settings select policy" on public.gst_settings;
drop policy if exists "GST settings insert policy" on public.gst_settings;
drop policy if exists "GST settings update policy" on public.gst_settings;
drop policy if exists "GST settings delete policy" on public.gst_settings;
drop policy if exists "authenticated can read gst" on public.gst_settings;
drop policy if exists "authenticated can update gst" on public.gst_settings;

-- Allow SELECT for authenticated staff, admin, trainer
create policy "GST settings select policy"
  on public.gst_settings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow INSERT for staff and admin only
create policy "GST settings insert policy"
  on public.gst_settings for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Allow UPDATE for admin only
create policy "GST settings update policy"
  on public.gst_settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow DELETE for admin only
create policy "GST settings delete policy"
  on public.gst_settings for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
