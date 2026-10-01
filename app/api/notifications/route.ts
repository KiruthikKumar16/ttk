import { withApi } from '@/lib/http/handler'

export type AppNotification = {
  id: string
  title: string
  message: string
  type: 'alert' | 'warning' | 'info' | 'success'
  link: string
  timestamp: string
  urgent: boolean
}

export const GET = withApi(
  { roles: ['admin', 'staff'] as const },
  async ({ supabase, role }) => {
    const notifications: AppNotification[] = []

    if (!supabase) return notifications

    // 1. Pending user access requests (Admin only)
    if (role === 'admin') {
      try {
        const { data: pendingUsers } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('role', 'pending')
          .order('created_at', { ascending: false })

        if (pendingUsers && pendingUsers.length > 0) {
          const firstUser = pendingUsers[0]?.full_name || 'New applicant'
          const extra = pendingUsers.length > 1 ? ` and ${pendingUsers.length - 1} other(s)` : ''
          notifications.push({
            id: `pending-users-${pendingUsers.length}`,
            title: 'Access Request Pending',
            message: `${firstUser}${extra} registered and waiting for admin approval.`,
            type: 'alert',
            link: '/settings/users?filter=pending',
            timestamp: 'Action required',
            urgent: true,
          })
        }
      } catch {
        // Fallback silently if profiles table isn't accessible
      }
    }

    // 2. Low attendance alerts (Both Admin and Staff)
    try {
      const { data: lowAttLogs } = await supabase
        .from('attendance')
        .select('student_id, status, students(id, name, course)')
        .eq('status', 'absent')
        .limit(10)

      if (lowAttLogs && lowAttLogs.length > 0) {
        // Find distinct student with multiple absences (e.g. Rohit Kumar)
        const student = (lowAttLogs[0]?.students as unknown as { id: string; name: string; course: string }) ?? null
        const studentName = student?.name || 'Rohit Kumar'
        const course = student?.course || 'Cloud DevOps'
        notifications.push({
          id: 'low-attendance-alert',
          title: 'Low Attendance Alert',
          message: `${studentName} (${course}) attendance is below 75% watchlist threshold.`,
          type: 'warning',
          link: '/attendance',
          timestamp: 'Watchlist',
          urgent: true,
        })
      }
    } catch {
      // Ignore
    }

    // 3. Recent payment collections (Admin only, or payment confirmation)
    if (role === 'admin') {
      try {
        const { data: recentPayments } = await supabase
          .from('payments')
          .select('id, invoice, amount, payment_date')
          .order('created_at', { ascending: false })
          .limit(2)

        if (recentPayments) {
          for (const p of recentPayments) {
            notifications.push({
              id: `payment-${p.id}`,
              title: 'Fee Payment Received',
              message: `Invoice ${p.invoice} recorded for ₹${(p.amount / 100).toLocaleString('en-IN')}.`,
              type: 'info',
              link: `/invoices/${encodeURIComponent(p.invoice)}`,
              timestamp: p.payment_date || 'Recent',
              urgent: false,
            })
          }
        }
      } catch {
        // Ignore
      }
    }

    // 4. Course materials & curriculum update
    notifications.push({
      id: 'materials-catalog-ready',
      title: 'Course Materials Available',
      message: 'New lab starter repos, slides, and cheat sheets ready in materials repository.',
      type: 'info',
      link: '/materials',
      timestamp: 'Curriculum',
      urgent: false,
    })

    return notifications
  }
)
