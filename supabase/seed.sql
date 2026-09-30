-- Local-only deterministic accounts and demo rows. This file runs after every
-- `supabase db reset`; do not run it against a shared or production project.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin@thoorigai.test', extensions.crypt('ThoorigaiLocal123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Local Admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'staff@thoorigai.test', extensions.crypt('ThoorigaiLocal123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Local Staff"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'trainer@thoorigai.test', extensions.crypt('ThoorigaiLocal123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Local Trainer"}', now(), now())
on conflict (id) do update set
  instance_id = excluded.instance_id,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

-- GoTrue expects unset token values on manually seeded auth.users rows to be
-- empty strings rather than NULL. Keep this limited to the disposable local
-- accounts created above.
update auth.users
set confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change = coalesce(email_change, ''),
    phone_change = coalesce(phone_change, ''),
    phone_change_token = coalesce(phone_change_token, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where email in ('admin@thoorigai.test', 'staff@thoorigai.test', 'trainer@thoorigai.test');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '{"sub":"00000000-0000-4000-8000-000000000001","email":"admin@thoorigai.test"}', 'email', now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '{"sub":"00000000-0000-4000-8000-000000000002","email":"staff@thoorigai.test"}', 'email', now(), now()),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', '{"sub":"00000000-0000-4000-8000-000000000003","email":"trainer@thoorigai.test"}', 'email', now(), now())
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  created_at = coalesce(auth.identities.created_at, excluded.created_at),
  updated_at = now();

insert into public.profiles (id, role, full_name)
values
  ('00000000-0000-4000-8000-000000000001', 'admin', 'Local Admin'),
  ('00000000-0000-4000-8000-000000000002', 'staff', 'Local Staff'),
  ('00000000-0000-4000-8000-000000000003', 'trainer', 'Local Trainer')
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

insert into public.courses (id, name, fee, duration, description, gst_inclusive)
values
  ('CRS-01', 'Professional Course', 4200000, '6 Months', 'Comprehensive software engineering and architecture training.', false),
  ('CRS-02', 'ThoorigAI Course - Internship', 3600000, '3 Months', 'Hands-on internship with an AI focus.', true),
  ('CRS-03', 'Crash Course (1.5 Months)', 2400000, '1.5 Months', 'Intensive modern web development fundamentals.', true),
  ('CRS-04', 'Slash Course (1 Month)', 1800000, '1 Month', 'Foundational UI and frontend training.', false),
  ('CRS-05', 'Full Stack Development', 4800000, '6 Months', 'Full stack development with current web tooling.', false),
  ('CRS-06', 'Data Science & AI', 5200000, '6 Months', 'Machine learning, LLMs, analytics, and Python.', true),
  ('CRS-07', 'UI/UX Design Masterclass', 3000000, '2 Months', 'Design systems, prototyping, and frontend foundations.', false)
on conflict (id) do update set
  name = excluded.name,
  fee = excluded.fee,
  duration = excluded.duration,
  description = excluded.description,
  gst_inclusive = excluded.gst_inclusive,
  updated_at = now();

insert into public.students (
  register_id, name, course, batch, total, paid, phone, status, gender, dob,
  email, country, state, city, area, lead_source, comments, knowledge_tags
)
values
  (1048, 'Kavya Srinivasan', 'Professional Course', '2026-08-12', 4200000, 0, '9876543210', 'Pending', 'Female', '2001-05-14', 'kavya.s@example.test', 'India', 'Tamil Nadu', 'Tuticorin', 'Millerpuram', 'Walk-in', 'Local demo learner.', array['Web Dev','React','Full Stack']),
  (1047, 'Arjun Prakash', 'ThoorigAI Course - Internship', '2026-08-09', 3600000, 0, '9840123456', 'Pending', 'Male', '2000-11-22', 'arjun.p@example.test', 'India', 'Tamil Nadu', 'Tirunelveli', 'Palayamkottai', 'Social Media', 'Local demo learner.', array['AI/ML','Python','Internship']),
  (1046, 'Meena Lakshmi', 'Crash Course (1.5 Months)', '2026-08-04', 2400000, 0, '9962012345', 'Pending', 'Female', '1999-08-19', 'meena.l@example.test', 'India', 'Tamil Nadu', 'Tuticorin', 'Cruz Fernandez Puram', 'Reference', 'Local demo learner.', array['Frontend','UI Design']),
  (1045, 'Rohit Kumar', 'Slash Course (1 Month)', '2026-07-28', 1800000, 0, '9789012345', 'Pending', 'Male', '2002-02-10', 'rohit.k@example.test', 'India', 'Tamil Nadu', 'Madurai', 'KK Nagar', 'Website', 'Local demo learner.', array['HTML/CSS','Beginner']),
  (1044, 'Divya Narayanan', 'Professional Course', '2026-07-20', 4200000, 0, '9884312345', 'Pending', 'Female', '2001-09-30', 'divya.n@example.test', 'India', 'Tamil Nadu', 'Tuticorin', 'Bryant Nagar', 'Campus Drive', 'Local demo learner.', array['Java','Web Dev'])
on conflict (register_id) do update set
  name = excluded.name,
  course = excluded.course,
  batch = excluded.batch,
  total = excluded.total,
  paid = coalesce((select sum(p.amount) from public.payments p where p.student_register_id = excluded.register_id and p.custom_note = 'local-seed'), 0),
  phone = excluded.phone,
  status = case when coalesce((select sum(p.amount) from public.payments p where p.student_register_id = excluded.register_id and p.custom_note = 'local-seed'), 0) >= excluded.total then 'Fully Paid' else 'Pending' end,
  gender = excluded.gender,
  dob = excluded.dob,
  email = excluded.email,
  country = excluded.country,
  state = excluded.state,
  city = excluded.city,
  area = excluded.area,
  lead_source = excluded.lead_source,
  comments = excluded.comments,
  knowledge_tags = excluded.knowledge_tags,
  updated_at = now();

insert into public.payments (
  student_id, student_register_id, method, amount, payment_date, custom_note, gst_rate
)
select s.id, demo.register_id, demo.method, demo.amount, demo.payment_date, 'local-seed', 18
from (values
  (1048, 'UPI', 4200000::bigint, date '2026-09-14'),
  (1047, 'Bank Transfer', 1800000::bigint, date '2026-09-13'),
  (1046, 'Cash', 2400000::bigint, date '2026-09-11'),
  (1045, 'UPI', 900000::bigint, date '2026-09-09'),
  (1044, 'UPI', 4200000::bigint, date '2026-09-08')
) as demo(register_id, method, amount, payment_date)
join public.students s on s.register_id = demo.register_id
where not exists (
  select 1 from public.payments p
  where p.student_register_id = demo.register_id and p.custom_note = 'local-seed'
);

insert into public.gst_settings (id, rate, gstin, enabled)
values ('default', 18, null, true)
on conflict (id) do nothing;
