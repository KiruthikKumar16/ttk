-- Optional demo records for local development. Re-running this file is safe.
-- Persisted monetary values in this seed are integer paise.
insert into public.courses (id, name, fee, duration, description, gst_inclusive)
values
  ('CRS-01', 'Professional Course', 4200000, '6 Months', 'Comprehensive industry-aligned software engineering and architecture training.', false),
  ('CRS-02', 'ThoorigAI Course - Internship', 3600000, '3 Months', 'Hands-on live client project internship focusing on AI-assisted application design.', true),
  ('CRS-03', 'Crash Course (1.5 Months)', 2400000, '1.5 Months', 'Fast-paced intensive program covering modern web development fundamentals.', true),
  ('CRS-04', 'Slash Course (1 Month)', 1800000, '1 Month', 'Foundational boot-camp focusing on UI design and frontend fundamentals.', false),
  ('CRS-05', 'Full Stack Development', 4800000, '6 Months', 'Complete MERN & Next.js ecosystem training with cloud database deployments.', false),
  ('CRS-06', 'Data Science & AI', 5200000, '6 Months', 'Practical machine learning, LLMs, data analytics, and Python frameworks.', true),
  ('CRS-07', 'UI/UX Design Masterclass', 3000000, '2 Months', 'Figma to frontend design systems, typography, micro-interactions, and prototyping.', false)
on conflict do nothing;

insert into public.students (
  id, register_id, name, course, batch, total, paid, phone, status, gender, dob,
  alt_phone, marital_status, email, country, state, city, area, lead_source,
  comments, knowledge_tags
)
values
  ('00000000-0000-4000-8000-000000001048', 1048, 'Kavya Srinivasan', 'Professional Course', '12 Aug 2026', 4200000, 4200000, '9876543210', 'Fully Paid', 'Female', '2001-05-14', '9876500001', 'Single', 'kavya.s@example.com', 'India', 'Tamil Nadu', 'Tuticorin', 'Millerpuram', 'Walk-in', 'Interested in core cloud architecture and full-stack deployment.', array['Web Dev', 'React', 'Full Stack']),
  ('00000000-0000-4000-8000-000000001047', 1047, 'Arjun Prakash', 'ThoorigAI Course - Internship', '09 Aug 2026', 3600000, 1800000, '9840123456', 'Pending', 'Male', '2000-11-22', null, 'Single', 'arjun.p@example.com', 'India', 'Tamil Nadu', 'Tirunelveli', 'Palayamkottai', 'Social Media', 'Looking for hands-on internship with AI focus.', array['AI/ML', 'Python', 'Internship']),
  ('00000000-0000-4000-8000-000000001046', 1046, 'Meena Lakshmi', 'Crash Course (1.5 Months)', '04 Aug 2026', 2400000, 2400000, '9962012345', 'Fully Paid', 'Female', '1999-08-19', null, 'Married', 'meena.l@example.com', 'India', 'Tamil Nadu', 'Tuticorin', 'Cruz Fernandez Puram', 'Reference', 'Referred by alumni. Wants fast track web frontend course.', array['Frontend', 'UI Design']),
  ('00000000-0000-4000-8000-000000001045', 1045, 'Rohit Kumar', 'Slash Course (1 Month)', '28 Jul 2026', 1800000, 900000, '9789012345', 'Pending', 'Male', '2002-02-10', null, 'Single', 'rohit.k@example.com', 'India', 'Tamil Nadu', 'Madurai', 'KK Nagar', 'Website', 'College student building weekend portfolio projects.', array['HTML/CSS', 'Beginner']),
  ('00000000-0000-4000-8000-000000001044', 1044, 'Divya Narayanan', 'Professional Course', '20 Jul 2026', 4200000, 4200000, '9884312345', 'Fully Paid', 'Female', '2001-09-30', null, 'Single', 'divya.n@example.com', 'India', 'Tamil Nadu', 'Tuticorin', 'Bryant Nagar', 'Campus Drive', 'Selected during campus drive. Excellent programming aptitude.', array['Java', 'Web Dev'])
on conflict do nothing;

insert into public.payments (
  id, student_id, student_register_id, method, amount, invoice, payment_date
)
values
  ('RCPT-1086', '00000000-0000-4000-8000-000000001048', 1048, 'UPI', 1200000, 'DEMO/2026/INV086', '2026-09-14'),
  ('RCPT-1085', '00000000-0000-4000-8000-000000001047', 1047, 'Bank Transfer', 1800000, 'DEMO/2026/INV085', '2026-09-13'),
  ('RCPT-1084', '00000000-0000-4000-8000-000000001046', 1046, 'Cash', 1200000, 'DEMO/2026/INV084', '2026-09-11'),
  ('RCPT-1083', '00000000-0000-4000-8000-000000001045', 1045, 'UPI', 900000, 'DEMO/2026/INV083', '2026-09-09')
on conflict do nothing;

insert into public.gst_settings (id, rate, gstin, enabled)
values ('default', 18, null, true)
on conflict do nothing;
