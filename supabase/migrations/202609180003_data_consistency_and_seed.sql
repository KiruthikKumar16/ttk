-- Migration 0003: Data consistency, payment balance enforcement, auto-updates, and seed data

-- ═══════════════════════════════════════════════════════════════════════
--  1. Add updated_at column + trigger to payments
-- ═══════════════════════════════════════════════════════════════════════
do $$ begin
  alter table public.payments
    add column if not exists updated_at timestamptz not null default now();
end $$;

drop trigger if exists _200_set_updated_at on public.payments;
create trigger _200_set_updated_at
before update on public.payments
for each row execute function public.tg__set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
--  2. DB-level payment consistency: enforce balance + auto-update student
-- ═══════════════════════════════════════════════════════════════════════

-- Trigger function: runs BEFORE INSERT on payments
-- - Prevents overpayments at the DB level (amount > remaining balance)
-- - Keeps students.paid and students.status in sync automatically
create or replace function public.tg__payments__sync_student()
returns trigger language plpgsql as $$
declare
  v_total   numeric(12,2);
  v_paid    numeric(12,2);
  v_balance numeric(12,2);
begin
  -- 1. Load student totals
  select total, paid
    into strict v_total, v_paid
    from public.students
   where id = NEW.student_id;

  -- 2. Reject overpayment
  v_balance := v_total - v_paid;
  if NEW.amount > v_balance then
    raise exception 'Payment amount % exceeds remaining balance of %',
      NEW.amount, v_balance;
  end if;

  -- 3. Update student totals + status atomically
  v_paid := v_paid + NEW.amount;
  update public.students
     set paid      = v_paid,
         status    = case when v_paid >= v_total then 'Fully Paid' else 'Pending' end,
         updated_at = now()
   where id = NEW.student_id;

  return NEW;
end $$;

drop trigger if exists _100_sync_student on public.payments;
create trigger _100_sync_student
before insert on public.payments
for each row execute function public.tg__payments__sync_student();

-- ═══════════════════════════════════════════════════════════════════════
--  3. Students status consistency trigger
--     When total or paid is manually updated on a student, re-derive status.
-- ═══════════════════════════════════════════════════════════════════════
create or replace function public.tg__students__derive_status()
returns trigger language plpgsql as $$
begin
  NEW.status := case when NEW.paid >= NEW.total then 'Fully Paid' else 'Pending' end;
  return NEW;
end $$;

drop trigger if exists _300_derive_status on public.students;
create trigger _300_derive_status
before insert or update of total, paid on public.students
for each row execute function public.tg__students__derive_status();

-- ═══════════════════════════════════════════════════════════════════════
--  4. Seed default courses (upsert, idempotent)
-- ═══════════════════════════════════════════════════════════════════════
insert into public.courses (id, name, fee, duration, description, gst_inclusive)
values
  ('CRS-01', 'Professional Course',            42000, '6 Months',   'Comprehensive industry-aligned software engineering and architecture training.', false),
  ('CRS-02', 'ThoorigAI Course - Internship',  36000, '3 Months',   'Hands-on live client project internship focusing on AI-assisted application design.', true),
  ('CRS-03', 'Crash Course (1.5 Months)',      24000, '1.5 Months', 'Fast-paced intensive program covering modern web development fundamentals.', true),
  ('CRS-04', 'Slash Course (1 Month)',         18000, '1 Month',    'Foundational boot-camp focusing on UI design and frontend fundamentals.', false),
  ('CRS-05', 'Full Stack Development',         48000, '6 Months',   'Complete MERN & Next.js ecosystem training with cloud database deployments.', false),
  ('CRS-06', 'Data Science & AI',              52000, '6 Months',   'Practical machine learning, LLMs, data analytics, and Python frameworks.', true),
  ('CRS-07', 'UI/UX Design Masterclass',       30000, '2 Months',   'Figma to frontend design systems, typography, micro-interactions, and prototyping.', false)
on conflict (id) do update
  set name          = excluded.name,
      fee           = excluded.fee,
      duration      = excluded.duration,
      description   = excluded.description,
      gst_inclusive = excluded.gst_inclusive,
      updated_at    = now();

-- ═══════════════════════════════════════════════════════════════════════
--  5. Seed sample students (skip if any students exist to avoid duplicates)
-- ═══════════════════════════════════════════════════════════════════════
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.students;
  if v_count = 0 then
    insert into public.students (register_id, name, course, batch, total, paid, phone, gender, dob, alt_phone, marital_status, email, country, state, city, area, lead_source, comments, knowledge_tags)
    values
      (1048, 'Kavya Srinivasan', 'Professional Course',            '2026-08-12', 42000, 42000, '9876543210', 'Female', '2001-05-14', '9876500001', 'Single', 'kavya.s@example.com',    'India', 'Tamil Nadu', 'Tuticorin',    'Millerpuram',          'Walk-in',     'Interested in core cloud architecture and full-stack deployment.',  array['Web Dev','React','Full Stack']),
      (1047, 'Arjun Prakash',   'ThoorigAI Course - Internship',  '2026-08-09', 36000, 18000, '9840123456', 'Male',   '2000-11-22', null,          'Single', 'arjun.p@example.com',    'India', 'Tamil Nadu', 'Tirunelveli',  'Palayamkottai',        'Social Media','Looking for hands-on internship with AI focus.',                      array['AI/ML','Python','Internship']),
      (1046, 'Meena Lakshmi',   'Crash Course (1.5 Months)',      '2026-08-04', 24000, 24000, '9962012345', 'Female', '1999-08-19', null,          'Married','meena.l@example.com',    'India', 'Tamil Nadu', 'Tuticorin',    'Cruz Fernandez Puram', 'Reference',   'Referred by alumni. Wants fast track web frontend course.',          array['Frontend','UI Design']),
      (1045, 'Rohit Kumar',     'Slash Course (1 Month)',         '2026-07-28', 18000,  9000, '9789012345', 'Male',   '2002-02-10', null,          'Single', 'rohit.k@example.com',    'India', 'Tamil Nadu', 'Madurai',      'KK Nagar',             'Website',     'College student building weekend portfolio projects.',               array['HTML/CSS','Beginner']),
      (1044, 'Divya Narayanan', 'Professional Course',            '2026-07-20', 42000, 42000, '9884312345', 'Female', '2001-09-30', null,          'Single', 'divya.n@example.com',    'India', 'Tamil Nadu', 'Tuticorin',    'Bryant Nagar',         'Campus Drive','Selected during campus drive. Excellent programming aptitude.',     array['Java','Web Dev']);
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
--  6. Seed sample payments (skip if any payments exist)
--     NOTE: The payments trigger itself will update students.paid/status,
--     so we insert only the raw payment rows.
-- ═══════════════════════════════════════════════════════════════════════
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.payments;
  if v_count = 0 then
    -- Kavya 1048 (already fully paid from seed student: 42000) — do not insert
    -- Arjun 1047 (paid = 18000 from seed)
    -- Meena 1046 (fully paid 24000 from seed)
    -- Rohit 1045 (paid = 9000 from seed)
    -- Divya 1044 (fully paid 42000 from seed)
    -- Note: Because our seed students already set paid amounts above,
    -- inserting additional payments here would cause balance violations.
    -- Real payment history should be created via the UI / API which always
    -- increments the student balance correctly at insert time.
  end if;
end $$;
