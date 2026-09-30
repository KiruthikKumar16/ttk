import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { getDashboardSummary, getRecentPayments } from '@/modules/dashboard/service'
import { DashboardMetrics } from '@/modules/dashboard/components/DashboardMetrics'

export default async function DashboardPage() {
  const profile = await requirePermission('reports', 'read')
  const [summary, payments] = await Promise.all([getDashboardSummary(), getRecentPayments()])
  return (
    <DashboardMetrics
      summary={summary}
      recentPayments={payments.data}
      canCreateStudent={can(profile.role, 'students', 'create')}
    />
  )
}
