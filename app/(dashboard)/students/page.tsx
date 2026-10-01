import { requirePermission } from '@/lib/auth/current-profile'
import { listStudentPage } from '@/modules/students/service'
import { listCourseCategories, listCourseOptions } from '@/modules/courses/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { StudentsView } from '@/modules/students/components/StudentsView'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({ searchParams }: PageProps<'/students'>) {
  const sp = await searchParams
  const query = parseListQuery(sp)
  const categoryId = typeof sp.categoryId === 'string' && sp.categoryId ? sp.categoryId : undefined
  const course = typeof sp.course === 'string' && sp.course ? sp.course : undefined

  const [profile, result, categories, courses] = await Promise.all([
    requirePermission('students', 'read'),
    listStudentPage({
      ...query,
      search: query.search,
      sort: query.sort,
      direction: query.direction,
      categoryId,
      course,
    }),
    listCourseCategories(),
    listCourseOptions(),
  ])

  return (
    <StudentsView
      students={result.data}
      categories={categories}
      courses={courses}
      selectedCategoryId={categoryId}
      selectedCourse={course}
      totalCount={result.totalCount}
      page={query.page}
      pageSize={query.pageSize}
      search={query.search}
      canCreate={profile.role === 'admin' || profile.role === 'staff'}
      role={profile.role}
    />
  )
}
