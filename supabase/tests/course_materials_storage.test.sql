begin;
select plan(4);

select ok(
  exists (
    select 1 from storage.buckets
    where id = 'course-materials' and public = false
      and file_size_limit = 20971520
      and allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg']
  ),
  'course materials use a private bucket limited to 20 MB and supported MIME types'
);

select ok(exists (
  select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'Course roles can upload materials' and cmd = 'INSERT'
    and with_check like '%course-materials%'
), 'course materials upload policy is scoped to its bucket');

select ok(exists (
  select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'Course roles can read materials' and cmd = 'SELECT'
    and qual like '%course-materials%'
), 'course materials read policy is scoped to its bucket');

select ok(exists (
  select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'Course roles can delete materials' and cmd = 'DELETE'
    and qual like '%course-materials%'
), 'course materials delete policy is scoped to its bucket');

select * from finish();
rollback;
