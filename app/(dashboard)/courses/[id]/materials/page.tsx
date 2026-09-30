import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { pagePagination } from '@/lib/pagination'
import { listCourseMaterials } from '@/modules/materials/service'
import { CourseMaterials } from '@/modules/materials/components/CourseMaterials'
import { can } from '@/lib/auth/permissions'

export default async function CourseMaterialsPage({ params, searchParams }: PageProps<'/courses/[id]/materials'>) {
  const profile = await requirePermission('materials', 'read')
  const [{ id }, search] = await Promise.all([params, searchParams])
  const page = Number(search.page ?? 1)
  const pageSize = Number(search.pageSize ?? 25)
  const pagination = pagePagination(page, pageSize)
  const result = await listCourseMaterials(id, pagination.page, pagination.pageSize)
  return (
    <>
      <div className="page-heading">
        <div>
          <Link href="/courses">Courses</Link>
          <h1>{result.courseName} materials</h1>
        </div>
      </div>
      <CourseMaterials
        courseId={id}
        initialMaterials={result.data}
        serverLoaded
        canUpload={can(profile.role, 'materials', 'create')}
      />
      <div className="panel-header">
        <Link
          href={`/courses/${id}/materials?page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
          aria-disabled={page === 1}
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link href={`/courses/${id}/materials?page=${page + 1}&pageSize=${pageSize}`}>Next</Link>
      </div>
    </>
  )
}
