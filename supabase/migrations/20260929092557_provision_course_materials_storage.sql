-- Provision the private bucket required by the course materials workflow.
-- Storage's metadata tables remain Supabase-managed; project migrations may
-- configure buckets and RLS policies on storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-materials',
  'course-materials',
  false,
  20971520,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Course roles can upload materials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'course-materials'
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'staff', 'trainer')
    )
  );

create policy "Course roles can read materials"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'course-materials'
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'staff', 'trainer')
    )
  );

create policy "Course roles can delete materials"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'course-materials'
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'staff', 'trainer')
    )
  );
