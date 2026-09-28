-- Migration 0012: Create course_materials table for storing course material metadata

-- ══════════════════════════════════════════════════════════════════════════════════
--  1. Create course_materials table
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  type text not null, -- e.g., 'pdf', 'video', 'document', 'presentation', 'zip', etc.
  storage_path text not null, -- The path within the Supabase Storage bucket
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.course_materials enable row level security;
grant select, insert, update, delete on public.course_materials to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
--  2. Create policies for course_materials
-- ═══════════════════════════════════════════════════════════════════════════════
-- Allow staff, admin, and trainer to insert course materials
create policy "Staff, admin, and trainer can create course materials"
  on public.course_materials for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow staff, admin, and trainer to select course materials
create policy "Staff, admin, and trainer can view course materials"
  on public.course_materials for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- Allow staff, admin, and trainer to update course materials
create policy "Staff, admin, and trainer can update course materials"
  on public.course_materials for update
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

-- Allow staff, admin, and trainer to delete course materials
create policy "Staff, admin, and trainer can delete course materials"
  on public.course_materials for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin', 'trainer')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
--  3. Notes on Supabase Storage bucket
-- ═══════════════════════════════════════════════════════════════════════════════
-- The following steps must be performed separately to set up the Supabase Storage bucket:
--
-- 1. Create a private bucket named "course-materials" in Supabase Storage.
--    This can be done via the Supabase dashboard or using the Supabase CLI:
--    $ supabase storage create bucket course-materials --private
--
-- 2. Set up storage bucket policies:
--    - Allow upload (insert) for authenticated users with role in ('staff', 'admin', 'trainer')
--    - Allow download (select) for any authenticated user
--
--    Example policies (to be set via Supabase dashboard or CLI):
--    -- Allow upload for staff, admin, trainer
--    create policy "Allow upload for staff/admin/trainer"
--      on storage.objects for insert
--      with check (
--        bucket_id = 'course-materials' and
--        auth.role() in ('staff', 'admin', 'trainer')
--      );
--
--    -- Allow download for any authenticated user
--    create policy "Allow download for authenticated users"
--      on storage.objects for select
--      using (bucket_id = 'course-materials');
--
--    Note: The above policy syntax is illustrative. The actual way to set policies
--    for Supabase Storage is through the dashboard or using the Supabase CLI with
--    the `supabase storage` commands. Refer to Supabase documentation for details.
--
-- 3. Ensure the bucket is set to private (not public) so that files are not
--    publicly accessible without a signed URL.
