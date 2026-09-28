import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payment, Student } from '@/lib/types'
import { captureError } from '@/lib/errorReporting'
import { normalizeJoined } from '@/lib/supabase/relations'

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
    gender: row.gender === 'Male' || row.gender === 'Female' || row.gender === 'Others'
      ? row.gender
      : undefined,
    dob: row.dob ? String(row.dob) : undefined,
    altPhone: row.alt_phone ? String(row.alt_phone) : undefined,
    maritalStatus: row.marital_status ? String(row.marital_status) : undefined,
    email: row.email ? String(row.email) : undefined,
    country: row.country ? String(row.country) : undefined,
    state: row.state ? String(row.state) : undefined,
    city: row.city ? String(row.city) : undefined,
    area: row.area ? String(row.area) : undefined,
    studentSource: row.lead_source ? String(row.lead_source) : undefined,
    /** Free-form admin comments */
    comments: row.comments ? String(row.comments) : undefined,
    /** Tags (Python, Java, Marketing, etc.) */
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
    verification_code: row.verification_code ? String(row.verification_code) : undefined,
  }
  if (cgst > 0 || sgst > 0 || row.transaction_id !== undefined || row.custom_note !== undefined || gstRate > 0) {
    return {
      ...base,
      cgst,
      sgst,
      gstRate: gstRate > 0 ? gstRate : undefined,
      transactionId: row.transaction_id ? String(row.transaction_id) : undefined,
      customNote: row.custom_note ? String(row.custom_note) : undefined,
    }
  }
  return base
}

export async function listStudents(
  supabaseClient: SupabaseClient,
  options: { page?: number; pageSize?: number } = {}
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1

  const { data, error, count } = await supabaseClient
    .from('students')
    .select('*', { count: 'exact' })
    .order('register_id', { ascending: false })
    .range(from, to)

  if (error) throw error
  return {
    data: (data ?? []).map(studentFromRow),
    count: data?.length ?? 0,
    page,
    pageSize,
    totalCount: count ?? 0,
  }
}

export async function listPayments(
  supabaseClient: SupabaseClient,
  options: { page?: number; pageSize?: number } = {}
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1

  const { data, error, count } = await supabaseClient
    .from('payments')
    .select(`
      id, student_id, student_register_id, method, amount, invoice, payment_date,
      transaction_id, custom_note, gst_rate, cgst, sgst,
      students ( id, name ),
      verifiable_documents (
        verification_code
      )
    `)
    .order('payment_date', { ascending: false })
    .range(from, to)

  if (error) throw error
  return {
    data: (data ?? []).map((row) => {
      const student = normalizeJoined(row.students)
      const verification = normalizeJoined(row.verifiable_documents)
      return paymentFromRow({
        ...row,
        student_name: student?.name,
        verification_code: verification?.verification_code,
      })
    }),
    count: data?.length ?? 0,
    page,
    pageSize,
    totalCount: count ?? 0,
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
  verification_code?: string
}

export async function listCertificates(supabaseClient: SupabaseClient) {
  // Fetch certificates with verification codes
  const { data, error } = await supabaseClient
    .from('certificates')
    .select(`
      *,
      verifiable_documents (
        verification_code
      )
    `)
    .order('issue_date', { ascending: false })

  if (error) {
    await captureError(error, { function: 'listCertificates' })
    throw error
  }

  // Map the data to include verification_code
  const mappedData = (data ?? []).map(row => ({
    ...row,
    verification_code: row.verifiable_documents?.[0]?.verification_code
  }))

  return mappedData as CertificateRow[]
}

export async function insertCertificate(
  supabaseClient: SupabaseClient,
  payload: {
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
  }
) {
  const { data, error } = await supabaseClient.from('certificates').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data as CertificateRow
}
