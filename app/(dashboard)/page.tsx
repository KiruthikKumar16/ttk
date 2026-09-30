import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { getDashboardSummary, getRecentPayments, getStaffDashboardData } from '@/modules/dashboard/service'
import { getAllStudents } from '@/modules/reports/service'
import { DashboardMetrics } from '@/modules/dashboard/components/DashboardMetrics'
import { StaffDashboardView } from '@/modules/dashboard/components/StaffDashboardView'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'

export default async function DashboardPage() {
  const profile = await requirePermission('reports', 'read')

  // If staff, serve the Academic & Classroom Operations Dashboard (no financial data fetched or leaked)
  if (profile.role === 'staff') {
    const staffData = await getStaffDashboardData()
    return <StaffDashboardView data={staffData} canCreateStudent={can(profile.role, 'students', 'create')} />
  }

  // Admin Executive Dashboard
  const [summary, payments, students, categories, courses] = await Promise.all([
    getDashboardSummary(),
    getRecentPayments(),
    getAllStudents(),
    listCourseCategories().catch(() => []),
    getCachedCourseOptions().catch(() => []),
  ])

  return (
    <DashboardMetrics
      summary={summary}
      students={students}
      recentPayments={payments.data}
      categories={categories}
      courses={courses}
      canCreateStudent={can(profile.role, 'students', 'create')}
    />
  )
}
