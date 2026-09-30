-- Aggregate dashboard metrics in PostgreSQL so page requests never load full lists.
-- SECURITY INVOKER preserves the caller's table grants and RLS policies.
create or replace function public.get_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'studentCount', (select count(*) from public.students),
    'revenuePaise', (select coalesce(sum(paid), 0) from public.students),
    'outstandingPaise', (select coalesce(sum(total - paid), 0) from public.students),
    'eligibleCount', (select count(*) from public.students where paid >= total),
    'monthlyRevenuePaise', (
      select coalesce(sum(amount), 0)
      from public.payments
      where payment_date >= date_trunc('month', current_date)::date
    ),
    'courseMix', (
      select coalesce(jsonb_agg(jsonb_build_object('course', course, 'studentCount', student_count)
                                order by student_count desc, course), '[]'::jsonb)
      from (
        select course, count(*) as student_count
        from public.students
        group by course
      ) as course_totals
    )
  );
$$;

revoke all on function public.get_dashboard_summary() from public;
grant execute on function public.get_dashboard_summary() to authenticated;
