-- Fix public_verify_document to support matching reference_id against both id and certificate_id / invoice
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
  v_clean_code text;
begin
  v_clean_code := trim(coalesce(p_code, ''));

  if v_clean_code = '' or length(v_clean_code) > 128 then
    return query select 'Invalid'::text, null::text, null::text, null::text, null::date, null::text;
    return;
  end if;

  -- 1. Try finding in verifiable_documents by verification_code or reference_id
  select vd.id, vd.doc_type, vd.reference_id, vd.verification_code, vd.status, vd.revoked_at
    into v_document
  from public.verifiable_documents as vd
  where vd.verification_code ilike v_clean_code
     or vd.reference_id ilike v_clean_code
  limit 1;

  if found then
    if v_document.status <> 'active' or v_document.revoked_at is not null then
      return query select 'Invalid'::text, null::text, null::text, null::text, null::date, null::text;
      return;
    end if;

    if v_document.doc_type = 'certificate' then
      select c.student_name, c.course_name, c.issue_date
        into v_student_name, v_course_name, v_issue_date
      from public.certificates as c
      where c.id::text = v_document.reference_id
         or c.certificate_id ilike v_document.reference_id
      limit 1;
    elsif v_document.doc_type = 'invoice' then
      select coalesce(s.name, p.student_name), s.course, p.payment_date, p.invoice
        into v_student_name, v_course_name, v_issue_date, v_invoice
      from public.payments as p
      left join public.students as s on s.id = p.student_id
      where p.id::text = v_document.reference_id
         or p.invoice ilike v_document.reference_id
      limit 1;
    end if;

    if v_issue_date is not null then
      return query select
        'Valid'::text,
        v_document.doc_type,
        case when v_student_name is null then null else left(v_student_name, 1) || '…' end,
        v_course_name,
        v_issue_date,
        v_invoice;
      return;
    else
      return query select 'Invalid'::text, null::text, null::text, null::text, null::date, null::text;
      return;
    end if;
  end if;

  -- 2. Fallback: check certificates table directly if code is a certificate_id
  select c.student_name, c.course_name, c.issue_date
    into v_student_name, v_course_name, v_issue_date
  from public.certificates as c
  where c.certificate_id ilike v_clean_code
     or c.id::text = v_clean_code
  limit 1;

  if found and v_issue_date is not null then
    return query select
      'Valid'::text,
      'certificate'::text,
      case when v_student_name is null then null else left(v_student_name, 1) || '…' end,
      v_course_name,
      v_issue_date,
      null::text;
    return;
  end if;

  -- 3. Fallback: check payments table directly if code is an invoice number
  select coalesce(s.name, p.student_name), s.course, p.payment_date, p.invoice
    into v_student_name, v_course_name, v_issue_date, v_invoice
  from public.payments as p
  left join public.students as s on s.id = p.student_id
  where p.invoice ilike v_clean_code
     or p.id::text = v_clean_code
  limit 1;

  if found and v_issue_date is not null then
    return query select
      'Valid'::text,
      'invoice'::text,
      case when v_student_name is null then null else left(v_student_name, 1) || '…' end,
      v_course_name,
      v_issue_date,
      v_invoice;
    return;
  end if;

  -- 4. Not found or invalid
  return query select 'Invalid'::text, null::text, null::text, null::text, null::date, null::text;
end;
$$;

revoke all on function public.public_verify_document(text) from public, anon, authenticated;
grant execute on function public.public_verify_document(text) to anon, authenticated;
