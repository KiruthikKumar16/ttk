create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  register_id integer not null unique,
  name text not null,
  course text not null,
  batch text not null,
  total numeric(12,2) not null check (total >= 0),
  paid numeric(12,2) not null default 0 check (paid >= 0 and paid <= total),
  phone text not null,
  status text not null default 'Pending' check (status in ('Fully Paid', 'Pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  student_id uuid not null references public.students(id) on delete restrict,
  student_register_id integer not null references public.students(register_id) on delete restrict,
  method text not null,
  amount numeric(12,2) not null check (amount > 0),
  invoice text not null unique,
  payment_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists payments_student_register_id_idx on public.payments(student_register_id);
create index if not exists payments_payment_date_idx on public.payments(payment_date desc);
create index if not exists students_status_idx on public.students(status);

alter table public.students enable row level security;
alter table public.payments enable row level security;

revoke all on public.students from anon, authenticated;
revoke all on public.payments from anon, authenticated;

grant select, insert, update on public.students to authenticated;
grant select, insert on public.payments to authenticated;

create policy "authenticated users can read students" on public.students for select to authenticated using (true);
create policy "authenticated users can create students" on public.students for insert to authenticated with check (true);
create policy "authenticated users can update students" on public.students for update to authenticated using (true) with check (true);
create policy "authenticated users can read payments" on public.payments for select to authenticated using (true);
create policy "authenticated users can create payments" on public.payments for insert to authenticated with check (true);
