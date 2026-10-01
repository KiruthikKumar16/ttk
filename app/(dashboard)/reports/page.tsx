import { requirePermission } from '@/lib/auth/current-profile'
import { getAllStudents, getAllPayments, getStaffAcademicReportData } from '@/modules/reports/service'
import { StaffReportsView } from '@/modules/reports/components/StaffReportsView'
import { AdminReportsClient } from '@/modules/reports/components/AdminReportsClient'
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

  // Admin Executive Reports: Fetch both financial and academic data for toggle switching
  const [students, payments, academicData, categories, courseOptions] = await Promise.all([
    getAllStudents(),
    getAllPayments(),
    getStaffAcademicReportData(),
    listCourseCategories().catch(() => []),
    getCachedCourseOptions().catch(() => []),
  ])

  return (
    <AdminReportsClient
      students={students}
      payments={payments}
      academicData={academicData}
      categories={categories}
      courses={courseOptions}
    />
  )
}
