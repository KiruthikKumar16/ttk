'use client'

import { useRouter } from 'next/navigation'
import type { Course, CourseCategory } from '@/lib/types'
import { CoursesManager } from '@/modules/courses/components/CoursesManager'

async function apiError(response: Response) {
  if (response.ok) return
  const result = await response.json()
  throw new Error(result.error?.message ?? result.error ?? 'Course change failed.')
}

export function CoursesManagerClient({
  courses,
  categories = [],
  selectedCategoryId,
  gstRate,
  search,
  page,
  pageSize,
  totalCount,
  canCreate,
  canUpdate,
  canDelete,
  canManageCategories = false,
  sort,
  direction,
}: {
  courses: Course[]
  categories?: CourseCategory[]
  selectedCategoryId?: string
  gstRate: number
  search: string
  page: number
  pageSize: number
  totalCount: number
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canManageCategories?: boolean
  sort: string
  direction: 'asc' | 'desc'
}) {
  const router = useRouter()
  return (
    <CoursesManager
      key={`${search}:${page}:${pageSize}:${sort}:${direction}:${selectedCategoryId || ''}`}
      courses={courses}
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      gstRate={gstRate}
      search={search}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
      canManageCategories={canManageCategories}
      sort={sort}
      direction={direction}
      onSaveCourse={async (course) => {
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course),
        })
        await apiError(response)
        router.refresh()
      }}
      onDeleteCourse={async (id) => {
        const response = await fetch(`/api/courses?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        await apiError(response)
        router.refresh()
      }}
    />
  )
}
