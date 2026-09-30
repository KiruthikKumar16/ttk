import { requirePermission } from '@/lib/auth/current-profile'
import { getAllStudents, getAllPayments } from '@/modules/reports/service'
import { ReportsView } from '@/modules/reports/components/ReportsView'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'

export default async function ReportsPage() {
  await requirePermission('reports', 'read')
  const [students, payments, categories, courseOptions] = await Promise.all([
    getAllStudents(),
    getAllPayments(),
    listCourseCategories(),
    getCachedCourseOptions(),
  ])

  return (
    <ReportsView
      students={students}
      payments={payments}
      categories={categories}
      courses={courseOptions}
    />
  )
}
