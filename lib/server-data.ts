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
    studentSource: row.lead_source ? String(row.lead_source) : undefined,
    comments: row.comments ? String(row.comments) : undefined,
    knowledgeTags: Array.isArray(row.knowledge_tags) ? row.knowledge_tags : undefined,
  }
}

export function paymentFromRow(row: Record<string, unknown>): Payment {
  const amount = Number(row.amount ?? 0)
  const cgst = Number(row.cgst ?? 0)
  const sgst = Number(row.sgst ?? 0)
  const gstRate = Number(row.gst_rate ?? row.gstRate ?? 0)
  const base: Payment = {
    id: String(row.id),
    student: String(row.student_name ?? row.student ?? ''),
    method: String(row.method),
    date: new Date(String(row.payment_date ?? row.date ?? new Date())).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    amount,
    invoice: String(row.invoice ?? ''),
    studentId: Number(row.student_register_id ?? row.student_id),
  }
  if (cgst > 0 || sgst > 0 || row.transaction_id !== undefined || row.custom_note !== undefined || gstRate > 0) {
    return {
      ...base,
      cgst,
      sgst,
      gstRate: gstRate > 0 ? gstRate : undefined,
      transactionId: row.transaction_id ? String(row.transaction_id) : undefined,
      customNote: row.custom_note ? String(row.custom_note) : undefined,
    } as Payment & Record<string, unknown>
  }
  return base
}

export async function listStudents() {
  if (!supabase) return initialStudents
  try {
    const { data, error } = await supabase.from('students').select('*').order('register_id', { ascending: false })
    if (error) throw error
    return (data ?? []).map(studentFromRow)
  } catch (err) {
    console.warn('Supabase query failed, falling back to mock students:', err)
    return initialStudents
  }
}

export async function listPayments() {
  if (!supabase) return initialPayments
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id, student_id, student_register_id, method, amount, invoice, payment_date,
        transaction_id, custom_note, gst_rate, cgst, sgst,
        students ( id, name )
      `)
      .order('payment_date', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) =>
      paymentFromRow({
        ...row,
        student_name: row.students?.name,
      })
    )
  } catch (err) {
    console.warn('Supabase query failed, falling back to mock payments:', err)
    return initialPayments
  }
}

export type CertificateRow = {
  id: string
  certificate_id: string
  student_id: string
  student_register_id: number
  course_name: string
  student_name: string
  start_date?: string
  end_date?: string
  issue_date: string
  skills?: string[]
  director_name?: string
  trainer_name?: string
  custom_note?: string
  issued_at: string
}

export async function listCertificates() {
  if (!supabase) return [] as CertificateRow[]
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('issue_date', { ascending: false })
  if (error) {
    console.warn('Supabase certificates query failed:', error)
    return [] as CertificateRow[]
  }
  return (data ?? []) as CertificateRow[]
}

export async function insertCertificate(payload: {
  certificate_id: string
  student_id: string
  student_register_id: number
  course_name: string
  student_name: string
  start_date?: string
  end_date?: string
  issue_date?: string
  skills?: string[]
  director_name?: string
  trainer_name?: string
  custom_note?: string
}) {
  if (!supabase) return null
  const { data, error } = await supabase.from('certificates').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data as CertificateRow
}
