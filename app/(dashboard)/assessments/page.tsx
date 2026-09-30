import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { listAssessmentPage } from '@/modules/assessments/service'
import { Assessments } from '@/modules/assessments/components/Assessments'
import { parseListQuery } from '@/modules/shared/list-query'
import { listCourseCategories } from '@/modules/courses/service'

export default async function AssessmentsPage({ searchParams }: PageProps<'/assessments'>) {
  await requirePermission('assessments', 'read')
  const params = await searchParams
  const query = parseListQuery(params)
  const courseId = Array.isArray(params.courseId) ? (params.courseId[0] ?? '') : (params.courseId ?? '')

  const [result, supabase, categories] = await Promise.all([
    listAssessmentPage({ ...query, courseId }),
    createClient(),
    listCourseCategories(),
  ])

  const { data: courseRows, error } = await supabase
    .from('courses')
    .select('id, name, category_id, category:course_categories(name)')
    .order('name')
    .limit(200)

  if (error) throw error

  const courses = (courseRows ?? []).map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    categoryId: row.category_id ? String(row.category_id) : null,
    categoryName: row.category?.name ? String(row.category.name) : null,
  }))

  return (
    <>
      <Assessments
        key={`${query.page}:${query.pageSize}:${query.search}:${courseId}`}
        initialAssessments={result.data}
        initialCourses={courses}
        categories={categories}
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
