-- Migration: Update attendance status constraint to include Exempt and migrate Excused to Exempt
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance add constraint attendance_status_check check (status in ('Present', 'Absent', 'Exempt', 'Excused', 'Late'));

update public.attendance set status = 'Exempt' where status = 'Excused';
