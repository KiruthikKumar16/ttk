import { requirePermission } from '@/lib/auth/current-profile'
import { getCachedGstCalculationSettings } from '@/modules/gst/service'
import { listCoursePage } from '@/modules/courses/service'
import { CoursesManagerClient } from '@/modules/courses/components/CoursesManagerClient'
import { parseListQuery } from '@/modules/shared/list-query'
import { can } from '@/lib/auth/permissions'

export default async function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  const profile = await requirePermission('courses', 'read')
  const query = parseListQuery(await searchParams)
  const [result, gst] = await Promise.all([
    listCoursePage({ ...query, search: query.search }),
    getCachedGstCalculationSettings(),
  ])
  return (
    <CoursesManagerClient
      courses={result.data}
      totalCount={result.totalCount}
      search={query.search}
      page={query.page}
      pageSize={query.pageSize}
      gstRate={gst?.enabled ? gst.rate : 0}
      canCreate={can(profile.role, 'courses', 'create')}
      canUpdate={can(profile.role, 'courses', 'update')}
      canDelete={can(profile.role, 'courses', 'delete')}
      sort={query.sort || 'name'}
      direction={query.direction}
    />
  )
}
