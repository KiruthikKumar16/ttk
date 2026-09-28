-- Migration 0007: Create audit_log table and triggers for tracking changes

-- ═══════════════════════════════════════════════════════════════════════════
--  1. Create audit_log table
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.audit_log (
  id bigserial primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid references public.profiles(id),
  changed_at timestamptz default now(),
  old_values jsonb,
  new_values jsonb
);

-- Enable Row Level Security (we'll keep it secure but allow admin access via policies)
alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
--  2. Create audit_log trigger function
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.audit_log_trigger_function()
returns trigger language plpgsql security definer as $$
begin
  -- We'll audit changes to payments and students tables
  if (tg_table_name = 'payments' or tg_table_name = 'students') then
    -- For students table, only audit when paid or status changes
    if (tg_table_name = 'students' and tg_op = 'UPDATE') then
      if (old.paid is distinct from new.paid or old.status is distinct from new.status) then
        insert into public.audit_log (
          table_name, record_id, action, changed_by, old_values, new_values
        ) values (
          tg_table_name,
          case when tg_op = 'DELETE' then old.id else new.id end,
          lower(tg_op),
          case when current_setting('request.jwt.claims', true) = '' then null
               else (current_setting('request.jwt.claims', true))::jsonb ->> 'sub' end::uuid,
          case when tg_op = 'INSERT' then null else to_jsonb(old) end,
          case when tg_op = 'DELETE' then null else to_jsonb(new) end
        );
      end if;
    else
      -- For payments (all actions) and students (insert/delete, or update of other fields)
      insert into public.audit_log (
        table_name, record_id, action, changed_by, old_values, new_values
      ) values (
        tg_table_name,
        case when tg_op = 'DELETE' then old.id else new.id end,
        lower(tg_op),
        case when current_setting('request.jwt.claims', true) = '' then null
             else (current_setting('request.jwt.claims', true))::jsonb ->> 'sub' end::uuid,
        case when tg_op = 'INSERT' then null else to_jsonb(old) end,
        case when tg_op = 'DELETE' then null else to_jsonb(new) end
      );
    end if;
  end if;

  return null; -- Trigger is AFTER, so return value is ignored
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
--  3. Create triggers on payments and students tables
-- ═══════════════════════════════════════════════════════════════════════════
-- Drop existing triggers if they exist to avoid conflicts
drop trigger if exists audit_payments_trigger on public.payments;
drop trigger if exists audit_students_trigger on public.students;

-- Create trigger for payments (audit all insert/update/delete)
create trigger audit_payments_trigger
after insert or update or delete on public.payments
for each row execute function public.audit_log_trigger_function();

-- Create trigger for students (audit insert/update/delete, but function will filter for paid/status changes on update)
create trigger audit_students_trigger
after insert or update or delete on public.students
for each row execute function public.audit_log_trigger_function();

-- ═══════════════════════════════════════════════════════════════════════════
--  4. Create policies for audit_log table (admin-only read access)
-- ═══════════════════════════════════════════════════════════════════════════
-- Policy: Admins can view audit logs
create policy "Admins can view audit logs"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: Only the trigger can insert into audit_log (prevent direct inserts)
create policy "Only trigger can insert audit logs"
  on public.audit_log for insert
  to authenticated
  with check (false); -- Prevent direct inserts, only allow via trigger (which runs as definer)

-- Policy: No updates or deletes allowed on audit_log
create policy "No updates or deletes on audit log"
  on public.audit_log for update or delete
  using (false);
