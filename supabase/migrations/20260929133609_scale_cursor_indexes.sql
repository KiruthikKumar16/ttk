-- Support stable newest-first keyset traversal on the largest operational lists.
create index if not exists payments_cursor_page_idx
  on public.payments (payment_date desc, id desc);

create index if not exists audit_log_cursor_page_idx
  on public.audit_log (changed_at desc, id desc);

create index if not exists attendance_course_session_cursor_idx
  on public.attendance (course_id, session_date desc, id desc);

create index if not exists attendance_session_cursor_idx
  on public.attendance (session_date desc, id desc);

comment on index public.payments_cursor_page_idx is
  'Supports newest-first payment cursor pagination by payment date and stable payment ID.';
comment on index public.audit_log_cursor_page_idx is
  'Supports newest-first audit log cursor pagination by timestamp and stable identity.';
comment on index public.attendance_course_session_cursor_idx is
  'Supports attendance session roster/history reads by course, date, and stable identity.';
comment on index public.attendance_session_cursor_idx is
  'Supports newest-first attendance history cursor pagination.';

-- Store generated invoice PDFs privately so repeat downloads avoid PDF and QR rendering.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoice-pdf-cache', 'invoice-pdf-cache', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
