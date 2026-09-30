import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { getDashboardSummary, getRecentPayments } from '@/modules/dashboard/service'
import { getAllStudents } from '@/modules/reports/service'
import { DashboardMetrics } from '@/modules/dashboard/components/DashboardMetrics'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'

export default async function DashboardPage() {
  const [profile, summary, payments, students, categories, courses] = await Promise.all([
    requirePermission('reports', 'read'),
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

