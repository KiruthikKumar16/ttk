import { requirePermission } from '@/lib/auth/current-profile'
import {
  getAllStudents,
  getAllPayments,
  getStaffAcademicReportData,
} from '@/modules/reports/service'
import { ReportsView } from '@/modules/reports/components/ReportsView'
import { StaffReportsView } from '@/modules/reports/components/StaffReportsView'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'

export default async function ReportsPage() {
  const profile = await requirePermission('reports', 'read')

  // If staff, serve academic performance and attendance analytics (no financial data fetched or leaked)
  if (profile.role === 'staff') {
    const [students, academicData, categories, courseOptions] = await Promise.all([
      getAllStudents(),
      getStaffAcademicReportData(),
      listCourseCategories().catch(() => []),
      getCachedCourseOptions().catch(() => []),
    ])

    return (
      <StaffReportsView
        students={students}
        academicData={academicData}
        categories={categories}
        courses={courseOptions}
      />
    )
  }

  // Admin Executive Financial Reports
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
