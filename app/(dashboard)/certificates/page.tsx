import { requirePermission } from '@/lib/auth/current-profile'
import { listCertificatePage } from '@/modules/certificates/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'
import { CertificatesManagerClient } from '@/modules/certificates/components/CertificatesManagerClient'

export default async function CertificatesPage({ searchParams }: PageProps<'/certificates'>) {
  await requirePermission('certificates', 'read')
  const params = await searchParams
  const query = parseListQuery(params)
  const categoryId = typeof params.categoryId === 'string' && params.categoryId ? params.categoryId : undefined
  const course = typeof params.course === 'string' && params.course ? params.course : undefined

  const [result, courseOptions, categories] = await Promise.all([
    listCertificatePage({ ...query, search: query.search, categoryId, course }),
    getCachedCourseOptions(),
    listCourseCategories(),
  ])

  const courseCategoryObject: Record<string, string> = {}
  for (const c of courseOptions) {
    if (c.categoryName) {
      courseCategoryObject[c.name.trim().toLowerCase()] = c.categoryName
    }
  }

  return (
    <CertificatesManagerClient
      certificates={result.data}
      totalCount={result.totalCount}
      page={query.page}
      pageSize={query.pageSize}
      search={query.search}
      sort={query.sort || 'issue_date'}
      direction={query.direction || 'desc'}
      categoryId={categoryId}
      course={course}
      courseCategoryMap={courseCategoryObject}
      categories={categories}
    />
  )
}
