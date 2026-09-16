import { NextResponse } from 'next/server'
import { listPayments, listStudents } from '@/lib/server-data'
import { supabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    const [students, payments] = await Promise.all([listStudents(), listPayments()])
    const revenue = students.reduce((sum, student) => sum + student.paid, 0)
    const outstanding = students.reduce((sum, student) => sum + student.total - student.paid, 0)
    const byMethod = payments.reduce<Record<string, number>>((summary, payment) => {
      summary[payment.method] = (summary[payment.method] ?? 0) + payment.amount
      return summary
    }, {})
    return NextResponse.json({ data: { students, payments, revenue, outstanding, eligible: students.filter(student => student.status === 'Fully Paid').length, byMethod }, source: supabase ? 'supabase' : 'mock' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to build report' }, { status: 500 })
  }
}
