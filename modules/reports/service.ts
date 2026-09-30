import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeJoined } from '@/lib/supabase/relations'
import { studentFromRow, paymentFromRow } from '@/lib/server-data'
import type { Student, Payment } from '@/lib/types'

export async function getAllStudents(): Promise<Student[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('register_id', { ascending: true })
  if (error) throw error
  return (data ?? []).map(studentFromRow)
}

export async function getAllPayments(): Promise<Payment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
        id, student_id, student_register_id, method, amount, invoice, payment_date,
        transaction_id, custom_note, gst_rate, cgst, sgst,
        students!payments_student_id_fkey ( id, name )
      `,
    )
    .order('payment_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const student = normalizeJoined(row.students)
    return paymentFromRow({
      ...row,
      student_name: student?.name,
    })
  })
}
