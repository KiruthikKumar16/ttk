-- Expose only masked document verification data to the public endpoint.
create or replace function public.public_verify_document(p_code text)
returns table (
  status text,
  document_type text,
  student_name text,
  course_name text,
  issue_date date,
  invoice_number text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_document record;
  v_student_name text;
  v_course_name text;
  v_issue_date date;
  v_invoice text;
begin
  select * into v_document
  from public.verifiable_documents
  where verification_code = left(coalesce(p_code, ''), 128);

  if not found or v_document.status <> 'active' or v_document.revoked_at is not null then
    return query select 'Invalid'::text, null::text, null::text, null::text, null::date, null::text;
    return;
  end if;

  if v_document.doc_type = 'certificate' then
    select c.student_name, c.course_name, c.issue_date
      into v_student_name, v_course_name, v_issue_date
    from public.certificates as c
    where c.id::text = v_document.reference_id;
  elsif v_document.doc_type = 'invoice' then
    select s.name, s.course, p.payment_date, p.invoice
      into v_student_name, v_course_name, v_issue_date, v_invoice
    from public.payments p
    join public.students s on s.id = p.student_id
    where p.id = v_document.reference_id::text;
  end if;

  if v_issue_date is null then
    return query select 'Invalid'::text, null::text, null::text, null::text, null::date, null::text;
    return;
  end if;

  return query select
    'Valid'::text,
    v_document.doc_type,
    case when v_student_name is null then null else left(v_student_name, 1) || '…' end,
    v_course_name,
    v_issue_date,
    v_invoice;
end;
$$;

revoke all on function public.public_verify_document(text) from public, anon, authenticated;
grant execute on function public.public_verify_document(text) to anon, authenticated;
