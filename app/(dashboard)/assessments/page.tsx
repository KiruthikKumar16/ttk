import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { listAssessmentPage } from '@/modules/assessments/service'
import { Assessments } from '@/modules/assessments/components/Assessments'
import { parseListQuery } from '@/modules/shared/list-query'

export default async function AssessmentsPage({ searchParams }: PageProps<'/assessments'>) {
  await requirePermission('assessments', 'read')
  const params = await searchParams
  const query = parseListQuery(params)
  const courseId = Array.isArray(params.courseId) ? (params.courseId[0] ?? '') : (params.courseId ?? '')
  const [result, supabase] = await Promise.all([listAssessmentPage({ ...query, courseId }), createClient()])
  const { data: courseRows, error } = await supabase.from('courses').select('id,name').order('name').limit(100)
  if (error) throw error
  const courses = (courseRows ?? []).map((row) => ({ id: String(row.id), name: String(row.name) }))
  return (
    <>
      <form action="/assessments" className="panel-header flex items-center gap-3">
        <label className="sr-only" htmlFor="assessment-search">
          Search assessments
        </label>
        <input id="assessment-search" name="search" defaultValue={query.search} placeholder="Search assessment title" />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="pageSize" value={query.pageSize} />
        <button className="btn-primary">Search</button>
      </form>
      <Assessments
        key={`${query.page}:${query.pageSize}:${query.search}:${courseId}`}
        initialAssessments={result.data}
        initialCourses={courses}
        initialTotalCount={result.totalCount}
        initialPage={query.page}
        initialPageSize={query.pageSize}
        initialCourseId={courseId}
        initialSearch={query.search}
        initialDataLoaded
      />
    </>
  )
}
