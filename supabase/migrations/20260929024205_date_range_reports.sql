create or replace function public.get_dashboard_summary_for_period(p_start_date date, p_end_date date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object(
    'studentCount', (
      select count(*) from public.students
      where created_at >= p_start_date and created_at < p_end_date + 1
    ),
    'revenuePaise', (
      select coalesce(sum(amount), 0) from public.payments
      where payment_date between p_start_date and p_end_date
    ),
    'outstandingPaise', (
      select coalesce(sum(total - paid), 0) from public.students
      where created_at >= p_start_date and created_at < p_end_date + 1
    ),
    'eligibleCount', (
      select count(*) from public.students
      where paid >= total and created_at >= p_start_date and created_at < p_end_date + 1
    ),
    'monthlyRevenuePaise', (
      select coalesce(sum(amount), 0) from public.payments
      where payment_date between p_start_date and p_end_date
    ),
    'courseMix', (
      select coalesce(pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('course', course, 'studentCount', student_count)
        order by student_count desc, course
      ), '[]'::jsonb)
      from (
        select course, count(*) as student_count from public.students
        where created_at >= p_start_date and created_at < p_end_date + 1
        group by course
      ) as course_totals
    )
  );
$function$;

revoke all on function public.get_dashboard_summary_for_period(date, date) from public, anon;
grant execute on function public.get_dashboard_summary_for_period(date, date) to authenticated;
