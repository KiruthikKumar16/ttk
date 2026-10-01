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
      <CourseMaterials
        courseId={id}
        courseName={result.courseName}
        initialMaterials={result.data}
        serverLoaded
        canUpload={can(profile.role, 'materials', 'create')}
      />
      <div className="panel-header mt-4">
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
