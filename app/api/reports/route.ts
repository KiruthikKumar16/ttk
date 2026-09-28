import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unexpectedApiError } from '@/lib/api-response'
import { listPayments, listStudents } from '@/lib/server-data'
import { collectPages } from '@/lib/pagination'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const [students, payments] = await Promise.all([
      collectPages(({ page, pageSize }) => listStudents(supabase, { page, pageSize })),
      collectPages(({ page, pageSize }) => listPayments(supabase, { page, pageSize })),
    ])
    const revenuePaise = students.reduce((sum, student) => sum + rupeesToPaise(student.paid), 0)
    const outstandingPaise = students.reduce(
      (sum, student) => sum + rupeesToPaise(student.total) - rupeesToPaise(student.paid),
      0,
    )
    const byMethodPaise = payments.reduce<Record<string, number>>((summary, payment) => {
      summary[payment.method] = (summary[payment.method] ?? 0) + rupeesToPaise(payment.amount)
      return summary
    }, {})
    const byMethod = Object.fromEntries(Object.entries(byMethodPaise).map(([method, amount]) => [method, paiseToRupees(amount)]))
    return NextResponse.json({ data: {
      students,
      payments,
      revenue: paiseToRupees(revenuePaise),
      outstanding: paiseToRupees(outstandingPaise),
      eligible: students.filter(student => student.status === 'Fully Paid').length,
      byMethod,
    } })
  } catch (error) {
    return unexpectedApiError(error, 'Unable to build report')
  }
}
