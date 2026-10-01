import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { getDashboardSummary, getRecentPayments, getStaffDashboardData } from '@/modules/dashboard/service'
import { getAllStudents } from '@/modules/reports/service'
import { DashboardMetrics } from '@/modules/dashboard/components/DashboardMetrics'
import { StaffDashboardView } from '@/modules/dashboard/components/StaffDashboardView'
import { getCachedCourseOptions, listCourseCategories } from '@/modules/courses/service'

import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const profile = await requirePermission('reports', 'read')

  // If staff, serve the Academic & Classroom Operations Dashboard (no financial data fetched or leaked)
  if (profile.role === 'staff') {
    const staffData = await getStaffDashboardData()
    return <StaffDashboardView data={staffData} canCreateStudent={can(profile.role, 'students', 'create')} />
  }

  // Admin Executive Dashboard
  const supabase = await createClient()
  const [summary, payments, students, categories, courses, pendingUsersRes, academicData] = await Promise.all([
    getDashboardSummary(),
    getRecentPayments(),
    getAllStudents(),
    listCourseCategories().catch(() => []),
    getCachedCourseOptions().catch(() => []),
    supabase.from('profiles').select('id, full_name, created_at').eq('role', 'pending'),
    getStaffDashboardData().catch(() => null),
  ])

  const pendingUsers = (pendingUsersRes.data ?? []).map((u) => ({
    id: String(u.id),
    fullName: u.full_name ? String(u.full_name) : 'New User',
    createdAt: u.created_at ? String(u.created_at) : undefined,
  }))

  return (
    <DashboardMetrics
      summary={summary}
      students={students}
      recentPayments={payments.data}
      categories={categories}
      courses={courses}
      pendingUsers={pendingUsers}
      academicData={academicData}
      canCreateStudent={can(profile.role, 'students', 'create')}
    />
  )
}
