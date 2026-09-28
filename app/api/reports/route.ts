import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unexpectedApiError } from '@/lib/api-response'
import { listPayments, listStudents } from '@/lib/server-data'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const [studentPage, paymentPage] = await Promise.all([
      listStudents(supabase, { pageSize: 1000 }),
      listPayments(supabase, { pageSize: 1000 }),
    ])
    const students = studentPage.data
    const payments = paymentPage.data
    const revenue = students.reduce((sum, student) => sum + student.paid, 0)
    const outstanding = students.reduce((sum, student) => sum + student.total - student.paid, 0)
    const byMethod = payments.reduce<Record<string, number>>((summary, payment) => {
      summary[payment.method] = (summary[payment.method] ?? 0) + payment.amount
      return summary
    }, {})
    return NextResponse.json({ data: { students, payments, revenue, outstanding, eligible: students.filter(student => student.status === 'Fully Paid').length, byMethod } })
  } catch (error) {
    return unexpectedApiError(error, 'Unable to build report')
  }
}
