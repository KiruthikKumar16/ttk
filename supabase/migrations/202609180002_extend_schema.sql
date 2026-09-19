-- Extended schema for Elysium Academy admin dashboard
-- Adds: courses table, full student profile columns, certificates table,
-- payment transaction metadata, and consistency with frontend types.

-- ═══════════════════════════════════════════════════════════════════════
--  COURSES
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.courses (
  id text primary key,
  name text not null unique,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  duration text,
  description text,
  gst_inclusive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
--  STUDENTS — extend base table with all UI profile fields
-- ═══════════════════════════════════════════════════════════════════════
do $$ begin
  alter table public.students add column if not exists gender text check (gender in ('Male','Female','Others'));
  alter table public.students add column if not exists dob date;
  alter table public.students add column if not exists alt_phone text;
  alter table public.students add column if not exists marital_status text;
  alter table public.students add column if not exists email text;
  alter table public.students add column if not exists country text;
  alter table public.students add column if not exists state text;
  alter table public.students add column if not exists city text;
  alter table public.students add column if not exists area text;
  alter table public.students add column if not exists lead_source text;
  alter table public.students add column if not exists comments text;
  alter table public.students add column if not exists knowledge_tags text[] not null default array[]::text[];
end $$;

create index if not exists students_course_idx on public.students(course);
create index if not exists students_phone_idx on public.students(phone);
create index if not exists students_email_idx on public.students(email);

-- ═══════════════════════════════════════════════════════════════════════
--  PAYMENTS — add optional transaction id + custom note columns
-- ═══════════════════════════════════════════════════════════════════════
do $$ begin
  alter table public.payments add column if not exists transaction_id text;
  alter table public.payments add column if not exists custom_note text;
  alter table public.payments add column if not exists gst_rate numeric(5,2) not null default 18;
  alter table public.payments add column if not exists cgst numeric(12,2) not null default 0 check (cgst >= 0);
  alter table public.payments add column if not exists sgst numeric(12,2) not null default 0 check (sgst >= 0);
  alter table public.payments add column if not exists grand_total numeric(12,2) generated always as (amount + cgst + sgst) stored;
end $$;

create index if not exists payments_invoice_idx on public.payments(invoice);
create index if not exists payments_transaction_id_idx on public.payments(transaction_id);

-- ═══════════════════════════════════════════════════════════════════════
--  CERTIFICATES — audit trail of generated certificates
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null unique,
  student_id uuid not null references public.students(id) on delete restrict,
  student_register_id integer not null references public.students(register_id) on delete restrict,
  course_name text not null,
  student_name text not null,
  start_date date,
  end_date date,
  issue_date date not null default current_date,
  skills text[] not null default array[]::text[],
  director_name text,
  trainer_name text,
  custom_note text,
  issued_at timestamptz not null default now()
);

create index if not exists certificates_student_id_idx on public.certificates(student_id);
create index if not exists certificates_certificate_id_idx on public.certificates(certificate_id);
create index if not exists certificates_issue_date_idx on public.certificates(issue_date desc);

-- ═══════════════════════════════════════════════════════════════════════
--  GST settings (admin singleton row)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.gst_settings (
  id text primary key default 'default',
  rate numeric(5,2) not null default 18 check (rate >= 0 and rate <= 100),
  gstin text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

do $$ begin
  insert into public.gst_settings (id, rate, gstin, enabled)
    values ('default', 18, '33AAZFT3654J1ZI', true)
    on conflict (id) do nothing;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
--  auto-updated_at triggers
-- ═══════════════════════════════════════════════════════════════════════
create or replace function public.tg__set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at := now();
  return NEW;
end $$;

drop trigger if exists _200_set_updated_at on public.courses;
create trigger _200_set_updated_at
before update on public.courses
for each row execute function public.tg__set_updated_at();

drop trigger if exists _200_set_updated_at on public.gst_settings;
create trigger _200_set_updated_at
before update on public.gst_settings
for each row execute function public.tg__set_updated_at();

drop trigger if exists _200_set_updated_at on public.students;
create trigger _200_set_updated_at
before update on public.students
for each row execute function public.tg__set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
--  RLS + grants
-- ═══════════════════════════════════════════════════════════════════════
alter table public.courses enable row level security;
alter table public.certificates enable row level security;
alter table public.gst_settings enable row level security;

revoke all on public.courses from anon, authenticated;
revoke all on public.certificates from anon, authenticated;
revoke all on public.gst_settings from anon, authenticated;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert on public.certificates to authenticated;
grant select, update on public.gst_settings to authenticated;

-- Courses: all authenticated users can manage
create policy "authenticated can read courses" on public.courses for select to authenticated using (true);
create policy "authenticated can insert courses" on public.courses for insert to authenticated with check (true);
create policy "authenticated can update courses" on public.courses for update to authenticated using (true) with check (true);
create policy "authenticated can delete courses" on public.courses for delete to authenticated using (true);

-- Certificates: read+write to all authenticated staff
create policy "authenticated can read certificates" on public.certificates for select to authenticated using (true);
create policy "authenticated can create certificates" on public.certificates for insert to authenticated with check (true);

-- GST settings: singleton row
create policy "authenticated can read gst" on public.gst_settings for select to authenticated using (true);
create policy "authenticated can update gst" on public.gst_settings for update to authenticated using (true) with check (true);
