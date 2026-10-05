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

  const supabase = await createClient()

  const [result, categories, rawCourses] = await Promise.all([
    listAssessmentPage({ ...query, courseId }).catch((err) => {
      console.warn('[AssessmentsPage] listAssessmentPage error:', err)
      return { totalCount: 0, data: [] }
    }),
    listCourseCategories().catch((err) => {
      console.warn('[AssessmentsPage] listCourseCategories error:', err)
      return []
    }),
    (async () => {
      try {
        const { data } = await supabase.from('courses').select('id, name, category_id').order('name').limit(200)
        return data ?? []
      } catch (err) {
        console.warn('[AssessmentsPage] courses query error:', err)
        return []
      }
    })(),
  ])

  const categoryMap = new Map((categories ?? []).map((c: any) => [c.id, c.name]))

  const courses = (rawCourses ?? []).map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    categoryId: row.category_id ? String(row.category_id) : null,
    categoryName: row.category_id ? (categoryMap.get(String(row.category_id)) ?? null) : null,
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
