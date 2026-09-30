import { requirePermission } from '@/lib/auth/current-profile'
import { getCachedGstCalculationSettings } from '@/modules/gst/service'
import { listCoursePage, listCourseCategories } from '@/modules/courses/service'
import { CoursesManagerClient } from '@/modules/courses/components/CoursesManagerClient'
import { parseListQuery } from '@/modules/shared/list-query'
import { can } from '@/lib/auth/permissions'

export default async function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  const profile = await requirePermission('courses', 'read')
  const rawParams = await searchParams
  const categoryId = typeof rawParams.categoryId === 'string' && rawParams.categoryId ? rawParams.categoryId : undefined
  const query = parseListQuery(rawParams)

  const [result, gst, categories] = await Promise.all([
    listCoursePage({ ...query, search: query.search, categoryId }),
    getCachedGstCalculationSettings(),
    listCourseCategories(),
  ])

  return (
    <CoursesManagerClient
      courses={result.data}
      categories={categories}
      selectedCategoryId={categoryId}
      totalCount={result.totalCount}
      search={query.search}
      page={query.page}
      pageSize={query.pageSize}
      gstRate={gst?.enabled ? gst.rate : 0}
      canCreate={can(profile.role, 'courses', 'create')}
      canUpdate={can(profile.role, 'courses', 'update')}
      canDelete={can(profile.role, 'courses', 'delete')}
      canManageCategories={can(profile.role, 'courses', 'manage')}
      sort={query.sort || 'name'}
      direction={query.direction}
    />
  )
}
