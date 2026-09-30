-- Course ownership is explicit so trainer access can be scoped consistently.
create table public.course_trainers (
  course_id text not null references public.courses(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,
  primary key (course_id, trainer_id)
);

alter table public.course_trainers enable row level security;
revoke all on public.course_trainers from anon, public;
grant select, insert, delete on public.course_trainers to authenticated;
create policy course_trainers_read_self_or_admin on public.course_trainers
  for select to authenticated using (
    trainer_id = (select auth.uid()) or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );
create policy course_trainers_admin_insert on public.course_trainers
  for insert to authenticated with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );
create policy course_trainers_admin_delete on public.course_trainers
  for delete to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

create or replace function public.audit_course_trainer_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  values (
    'course_trainers',
    md5(coalesce(old.course_id, new.course_id) || ':' || coalesce(old.trainer_id, new.trainer_id)::text)::uuid,
    lower(tg_op),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    case when tg_op = 'INSERT' then null else jsonb_build_object('course_id', old.course_id, 'trainer_id', old.trainer_id) end,
    case when tg_op = 'DELETE' then null else jsonb_build_object('course_id', new.course_id, 'trainer_id', new.trainer_id) end
  );
  return null;
end;
$$;
revoke all on function public.audit_course_trainer_assignment() from public, anon, authenticated;
create trigger audit_course_trainers after insert or delete on public.course_trainers
  for each row execute function public.audit_course_trainer_assignment();

-- Replace legacy role-only policies with course-aware policies.
drop policy if exists "Staff and admin can manage attendance" on public.attendance;
drop policy if exists "Staff and admin can view attendance" on public.attendance;
drop policy if exists "Trainers can manage attendance for their courses" on public.attendance;
drop policy if exists "Trainers can view attendance for their courses" on public.attendance;
drop policy if exists "Staff, admin, and trainer can update attendance" on public.attendance;
drop policy if exists "No updates or deletes on attendance" on public.attendance;
create policy attendance_read_assigned on public.attendance for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = attendance.course_id and ct.trainer_id = (select auth.uid()))
);
create policy attendance_insert_assigned on public.attendance for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = attendance.course_id and ct.trainer_id = (select auth.uid()))
);
create policy attendance_update_assigned on public.attendance for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = attendance.course_id and ct.trainer_id = (select auth.uid()))
) with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = attendance.course_id and ct.trainer_id = (select auth.uid()))
);

drop policy if exists "Staff, admin, and trainer can create assessments" on public.assessments;
drop policy if exists "Staff, admin, and trainer can view assessments" on public.assessments;
drop policy if exists "Staff, admin, and trainer can update assessments" on public.assessments;
drop policy if exists "Staff, admin, and trainer can delete assessments" on public.assessments;
create policy assessments_read_assigned on public.assessments for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = assessments.course_id and ct.trainer_id = (select auth.uid()))
);
create policy assessments_insert_assigned on public.assessments for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = assessments.course_id and ct.trainer_id = (select auth.uid()))
);
create policy assessments_update_assigned on public.assessments for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = assessments.course_id and ct.trainer_id = (select auth.uid()))
) with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = assessments.course_id and ct.trainer_id = (select auth.uid()))
);
create policy assessments_delete_assigned on public.assessments for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = assessments.course_id and ct.trainer_id = (select auth.uid()))
);

drop policy if exists "Staff, admin, and trainer can create assessment results" on public.assessment_results;
drop policy if exists "Staff, admin, and trainer can view assessment results" on public.assessment_results;
drop policy if exists "Staff, admin, and trainer can update assessment results" on public.assessment_results;
drop policy if exists "Staff, admin, and trainer can delete assessment results" on public.assessment_results;
create policy results_read_assigned on public.assessment_results for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.assessments a join public.course_trainers ct on ct.course_id = a.course_id where a.id = assessment_results.assessment_id and ct.trainer_id = (select auth.uid()))
);
create policy results_insert_assigned on public.assessment_results for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.assessments a join public.course_trainers ct on ct.course_id = a.course_id where a.id = assessment_results.assessment_id and ct.trainer_id = (select auth.uid()))
);
create policy results_update_assigned on public.assessment_results for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.assessments a join public.course_trainers ct on ct.course_id = a.course_id where a.id = assessment_results.assessment_id and ct.trainer_id = (select auth.uid()))
) with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.assessments a join public.course_trainers ct on ct.course_id = a.course_id where a.id = assessment_results.assessment_id and ct.trainer_id = (select auth.uid()))
);
create policy results_delete_assigned on public.assessment_results for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.assessments a join public.course_trainers ct on ct.course_id = a.course_id where a.id = assessment_results.assessment_id and ct.trainer_id = (select auth.uid()))
);

drop policy if exists "Staff, admin, and trainer can create course materials" on public.course_materials;
drop policy if exists "Staff, admin, and trainer can view course materials" on public.course_materials;
drop policy if exists "Staff, admin, and trainer can update course materials" on public.course_materials;
drop policy if exists "Staff, admin, and trainer can delete course materials" on public.course_materials;
create policy materials_read_assigned on public.course_materials for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = course_materials.course_id and ct.trainer_id = (select auth.uid()))
);
create policy materials_insert_assigned on public.course_materials for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = course_materials.course_id and ct.trainer_id = (select auth.uid()))
);
create policy materials_update_assigned on public.course_materials for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = course_materials.course_id and ct.trainer_id = (select auth.uid()))
) with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = course_materials.course_id and ct.trainer_id = (select auth.uid()))
);
create policy materials_delete_assigned on public.course_materials for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','staff'))
  or exists (select 1 from public.course_trainers ct where ct.course_id = course_materials.course_id and ct.trainer_id = (select auth.uid()))
);

create or replace view public.attendance_summary with (security_invoker = true) as
select a.course_id, c.name as course_name, a.student_id, s.register_id, s.name as student_name,
       count(*)::integer as sessions,
       count(*) filter (where a.status = 'Present')::integer as present_sessions,
       round(100.0 * count(*) filter (where a.status = 'Present') / nullif(count(*), 0), 1) as attendance_percent
from public.attendance a
join public.students s on s.id = a.student_id
join public.courses c on c.id = a.course_id
group by a.course_id, c.name, a.student_id, s.register_id, s.name;
revoke all on public.attendance_summary from anon, public;
grant select on public.attendance_summary to authenticated;

create or replace view public.attendance_course_summary with (security_invoker = true) as
select a.course_id, c.name as course_name,
       count(distinct a.student_id)::integer as students,
       count(*)::integer as sessions,
       count(*) filter (where a.status = 'Present')::integer as present_sessions,
       round(100.0 * count(*) filter (where a.status = 'Present') / nullif(count(*), 0), 1) as attendance_percent
from public.attendance a
join public.courses c on c.id = a.course_id
group by a.course_id, c.name;
revoke all on public.attendance_course_summary from anon, public;
grant select on public.attendance_course_summary to authenticated;
