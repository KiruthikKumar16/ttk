-- Make student and payment writes transactional and idempotent.
-- This is a forward migration; the earlier shared migrations remain untouched.

create table if not exists public.idempotency_keys (
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (length(idempotency_key) between 1 and 200),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  response jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  primary key (actor_id, idempotency_key)
);

alter table public.idempotency_keys enable row level security;
revoke all on public.idempotency_keys from anon, authenticated;
revoke all on public.idempotency_keys from authenticated;
create index if not exists idempotency_keys_expires_at_idx
  on public.idempotency_keys (expires_at);

-- Audit records have a UUID key, while payments use human-readable text IDs.
-- Keep the payment row in the JSON values and link its audit row to the student UUID.
create or replace function public.audit_log_trigger_function()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_record_id uuid;
  v_actor_id uuid;
begin
  if tg_table_name = 'payments' then
    v_record_id := case when tg_op = 'DELETE' then old.student_id else new.student_id end;
  else
    v_record_id := case when tg_op = 'DELETE' then old.id else new.id end;
  end if;

  if tg_table_name = 'students' and tg_op = 'UPDATE'
     and to_jsonb(old) -> 'paid' is not distinct from to_jsonb(new) -> 'paid'
     and to_jsonb(old) -> 'status' is not distinct from to_jsonb(new) -> 'status' then
    return null;
  end if;

  begin
    v_actor_id := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  exception when invalid_text_representation then
    v_actor_id := null;
  end;

  insert into public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  values (
    tg_table_name, v_record_id, lower(tg_op), v_actor_id,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return null;
end $$;

drop trigger if exists _100_sync_student on public.payments;
drop function if exists public.tg__payments__sync_student();
revoke insert on public.students, public.payments from authenticated;

create or replace function public.record_payment(
  p_student_register_id integer,
  p_amount bigint,
  p_method text,
  p_payment_date date,
  p_transaction_id text,
  p_custom_note text,
  p_gst_rate numeric,
  p_cgst bigint,
  p_sgst bigint,
  p_verification_code text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student public.students%rowtype;
  v_payment public.payments%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')
  ) then raise exception 'Not authorized to record payments' using errcode = '42501'; end if;
  if p_amount <= 0 or p_cgst < 0 or p_sgst < 0 then
    raise exception 'Payment amounts must be positive' using errcode = '22023';
  end if;

  select * into v_student from public.students
   where register_id = p_student_register_id for update;
  if not found then raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_amount > v_student.total - v_student.paid then
    raise exception 'PAYMENT_EXCEEDS_BALANCE' using errcode = 'P0001';
  end if;

  perform set_config('app.atomic_payment_rpc', 'on', true);
  insert into public.payments (
    student_id, student_register_id, method, amount, payment_date,
    transaction_id, custom_note, gst_rate, cgst, sgst
  ) values (
    v_student.id, v_student.register_id, p_method, p_amount, p_payment_date,
    p_transaction_id, p_custom_note, p_gst_rate, p_cgst, p_sgst
  ) returning * into v_payment;

  update public.students
     set paid = paid + p_amount,
         status = case when paid + p_amount >= total then 'Fully Paid' else 'Pending' end,
         updated_at = now()
   where id = v_student.id
   returning * into v_student;

  insert into public.verifiable_documents (doc_type, reference_id, verification_code, status)
  values ('invoice', v_payment.id, p_verification_code, 'active');

  return jsonb_build_object('payment', to_jsonb(v_payment), 'student', to_jsonb(v_student),
    'verification_code', p_verification_code);
end $$;

create or replace function public.record_payment_idempotent(
  p_idempotency_key text,
  p_request_hash text,
  p_student_register_id integer,
  p_amount bigint,
  p_method text,
  p_payment_date date,
  p_transaction_id text,
  p_custom_note text,
  p_gst_rate numeric,
  p_cgst bigint,
  p_sgst bigint,
  p_verification_code text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing public.idempotency_keys%rowtype;
  v_response jsonb;
begin
  if v_actor is null or not exists (
    select 1 from public.profiles p where p.id = v_actor and p.role in ('admin','staff')
  ) then raise exception 'Not authorized to record payments' using errcode = '42501'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) not between 1 and 200 then
    raise exception 'Invalid idempotency key' using errcode = '22023';
  end if;
  if p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid request hash' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':' || p_idempotency_key, 0));
  with expired_keys as (
    select ctid from public.idempotency_keys where expires_at <= now()
    order by expires_at limit 100 for update skip locked
  )
  delete from public.idempotency_keys where ctid in (select ctid from expired_keys);
  delete from public.idempotency_keys
   where actor_id = v_actor and idempotency_key = p_idempotency_key and expires_at <= now();

  select * into v_existing from public.idempotency_keys
   where actor_id = v_actor and idempotency_key = p_idempotency_key for update;
  if found then
    if v_existing.request_hash <> p_request_hash then
      raise exception 'IDEMPOTENCY_KEY_REUSED' using errcode = 'P0001';
    end if;
    if v_existing.response is not null then return v_existing.response; end if;
    raise exception 'IDEMPOTENCY_REQUEST_INCOMPLETE' using errcode = 'P0001';
  end if;

  insert into public.idempotency_keys (actor_id, idempotency_key, request_hash)
  values (v_actor, p_idempotency_key, p_request_hash);
  v_response := public.record_payment(
    p_student_register_id, p_amount, p_method, p_payment_date, p_transaction_id,
    p_custom_note, p_gst_rate, p_cgst, p_sgst, p_verification_code
  );
  update public.idempotency_keys set response = v_response
   where actor_id = v_actor and idempotency_key = p_idempotency_key;
  return v_response;
end $$;

create or replace function public.create_student_with_payment(
  p_student jsonb,
  p_initial_payment_amount bigint,
  p_initial_payment_date date,
  p_verification_code text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student public.students%rowtype;
  v_payment jsonb := null;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')
  ) then raise exception 'Not authorized to create students' using errcode = '42501'; end if;
  if p_initial_payment_amount < 0 then raise exception 'Invalid initial payment' using errcode = '22023'; end if;

  insert into public.students (
    name, phone, course, batch, total, paid, status, gender, dob, alt_phone,
    marital_status, email, country, state, city, area, lead_source, comments, knowledge_tags
  ) values (
    p_student->>'name', p_student->>'phone', p_student->>'course', p_student->>'batch',
    (p_student->>'total')::bigint, 0, 'Pending', nullif(p_student->>'gender',''),
    nullif(p_student->>'dob','')::date, nullif(p_student->>'alt_phone',''),
    nullif(p_student->>'marital_status',''), nullif(p_student->>'email',''),
    nullif(p_student->>'country',''), nullif(p_student->>'state',''),
    nullif(p_student->>'city',''), nullif(p_student->>'area',''),
    nullif(p_student->>'lead_source',''), nullif(p_student->>'comments',''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_student->'knowledge_tags','[]'::jsonb))), array[]::text[])
  ) returning * into v_student;

  if p_initial_payment_amount > 0 then
    if p_initial_payment_amount > v_student.total then
      raise exception 'INITIAL_PAYMENT_EXCEEDS_TOTAL' using errcode = 'P0001';
    end if;
    v_payment := public.record_payment(
      v_student.register_id, p_initial_payment_amount, 'Initial Payment',
      p_initial_payment_date, null, null, 18,
      round(p_initial_payment_amount * 0.09)::bigint,
      round(p_initial_payment_amount * 0.09)::bigint,
      p_verification_code
    );
    select * into v_student from public.students where id = v_student.id;
  end if;

  return jsonb_build_object('student', to_jsonb(v_student), 'initial_payment', v_payment);
end $$;

revoke execute on function public.record_payment(integer,bigint,text,date,text,text,numeric,bigint,bigint,text) from public, anon, authenticated;
revoke execute on function public.record_payment_idempotent(text,text,integer,bigint,text,date,text,text,numeric,bigint,bigint,text) from public, anon;
revoke execute on function public.create_student_with_payment(jsonb,bigint,date,text) from public, anon;
grant execute on function public.record_payment_idempotent(text,text,integer,bigint,text,date,text,text,numeric,bigint,bigint,text) to authenticated;
grant execute on function public.create_student_with_payment(jsonb,bigint,date,text) to authenticated;
