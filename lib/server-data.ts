import { initialPayments, initialStudents } from '@/lib/mock-data'
import type { Payment, Student } from '@/lib/types'
import { supabase } from '@/lib/supabase/server'

export function studentFromRow(row: Record<string, unknown>): Student {
  const total = Number(row.total ?? 0)
  const paid = Number(row.paid ?? 0)
  return {
    registerId: Number(row.register_id),
    name: String(row.name),
    course: String(row.course),
    batch: String(row.batch),
    total,
    paid,
    phone: String(row.phone ?? ''),
    status: paid >= total ? 'Fully Paid' : 'Pending',
    gender: row.gender as any,
    dob: row.dob ? String(row.dob) : undefined,
    altPhone: row.alt_phone ? String(row.alt_phone) : undefined,
    maritalStatus: row.marital_status ? String(row.marital_status) : undefined,
    email: row.email ? String(row.email) : undefined,
    country: row.country ? String(row.country) : undefined,
    state: row.state ? String(row.state) : undefined,
    city: row.city ? String(row.city) : undefined,
    area: row.area ? String(row.area) : undefined,
    leadType: row.lead_type as any,
    leadSource: row.lead_source ? String(row.lead_source) : undefined,
    comments: row.comments ? String(row.comments) : undefined,
    knowledgeTags: Array.isArray(row.knowledge_tags) ? row.knowledge_tags : undefined,
  }
}

export function paymentFromRow(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    student: String(row.student_name ?? row.student ?? ''),
    method: String(row.method),
    date: new Date(String(row.payment_date)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    amount: Number(row.amount),
    invoice: String(row.invoice),
    studentId: Number(row.student_register_id ?? row.student_id),
  }
}

export async function listStudents() {
  if (!supabase) return initialStudents
  const { data, error } = await supabase.from('students').select('*').order('register_id', { ascending: false })
  if (error) throw error
  return (data ?? []).map(studentFromRow)
}

export async function listPayments() {
  if (!supabase) return initialPayments
  const { data, error } = await supabase.from('payments').select('*, students!payments_student_id_fkey(name)').order('payment_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => paymentFromRow({ ...row, student_name: (row.students as { name?: string } | null)?.name }))
}
