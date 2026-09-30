import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payment, Student } from '@/lib/types'
import { captureError } from '@/lib/errorReporting'
import { normalizeJoined } from '@/lib/supabase/relations'
import { pagePagination } from '@/lib/pagination'
import { paiseToRupees } from '@/lib/money'
import { decodeCursor, encodeCursor } from '@/lib/pagination'
import { z } from 'zod'

export function studentFromRow(row: Record<string, unknown>): Student {
  const total = paiseToRupees(Number(row.total ?? 0))
  const paid = paiseToRupees(Number(row.paid ?? 0))
  return {
    registerId: Number(row.register_id),
    name: String(row.name),
    course: String(row.course),
    batch: String(row.batch),
    total,
    paid,
    phone: String(row.phone ?? ''),
    status: paid >= total ? 'Fully Paid' : 'Pending',
    gender: row.gender === 'Male' || row.gender === 'Female' || row.gender === 'Others' ? row.gender : undefined,
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
  const amount = paiseToRupees(Number(row.amount ?? 0))
  const cgst = paiseToRupees(Number(row.cgst ?? 0))
  const sgst = paiseToRupees(Number(row.sgst ?? 0))
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
    course: (row.students as any)?.course ? String((row.students as any).course) : undefined,
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
  options: {
    page?: number
    pageSize?: number
    search?: string
    sort?: 'register_id' | 'name' | 'created_at'
    direction?: 'asc' | 'desc'
    categoryId?: string
    course?: string
  } = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const pagination = pagePagination(page, pageSize)

  let query = supabaseClient.from('students').select('*', { count: 'exact' })
  const search = options.search?.trim().slice(0, 100)
  if (search) {
    const safeSearch = search.replace(/[\\%_,()]/g, ' ').trim()
    const registerId = /^\d+$/.test(safeSearch) ? `,register_id.eq.${Number(safeSearch)}` : ''
    query = query.or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%${registerId}`)
  }

  if (options.course && options.course.trim()) {
    query = query.eq('course', options.course.trim())
  } else if (options.categoryId && options.categoryId.trim()) {
    const { data: coursesInCategory, error: catError } = await supabaseClient
      .from('courses')
      .select('name')
      .eq('category_id', options.categoryId.trim())
    if (catError) throw catError
    const names = (coursesInCategory ?? []).map((c: any) => c.name)
    if (names.length > 0) {
      query = query.in('course', names)
    } else {
      query = query.eq('course', '__no_matching_course__')
    }
  }

  const { data, error, count } = await query
    .order(options.sort ?? 'register_id', { ascending: options.direction === 'asc' })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)

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
  options: {
    page?: number
    pageSize?: number
    search?: string
    studentId?: number
    date?: string
    sort?: 'payment_date' | 'amount' | 'invoice'
    direction?: 'asc' | 'desc'
    keyset?: boolean
    cursor?: string
  } = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const pagination = pagePagination(page, pageSize)

  let query = supabaseClient.from('payments').select(
    `
      id, student_id, student_register_id, method, amount, invoice, payment_date,
      transaction_id, custom_note, gst_rate, cgst, sgst,
      students!payments_student_id_fkey ( id, name, course )
    `,
    options.keyset ? undefined : { count: 'exact' },
  )
  const paymentCursorSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
  })
  if (options.keyset && options.cursor) {
    const cursor = decodeCursor(options.cursor, paymentCursorSchema)
    query = query.or(`payment_date.lt.${cursor.date},and(payment_date.eq.${cursor.date},id.lt.${cursor.id})`)
  }
  if (options.studentId !== undefined) query = query.eq('student_register_id', options.studentId)
  if (options.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date)) query = query.eq('payment_date', options.date)
  const search = options.search?.trim().slice(0, 100)
  if (search) {
    const safeSearch = search.replace(/[\\%_,()]/g, ' ').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(safeSearch)) query = query.eq('payment_date', safeSearch)
    else {
      const matchingStudentIds: number[] = []
      if (/^\d+$/.test(safeSearch)) matchingStudentIds.push(Number(safeSearch))
      const { data: students, error: studentSearchError } = await supabaseClient
        .from('students')
        .select('register_id')
        .or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`)
        .limit(100)
      if (studentSearchError) throw studentSearchError
      matchingStudentIds.push(...(students ?? []).map((student) => Number(student.register_id)))
      const studentFilter = matchingStudentIds.length
        ? `,student_register_id.in.(${[...new Set(matchingStudentIds)].join(',')})`
        : ''
      query = query.or(`invoice.ilike.%${safeSearch}%${studentFilter}`)
    }
  }
  const orderedQuery = options.keyset
    ? query
        .order('payment_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize + 1)
    : query
        .order(options.sort ?? 'payment_date', { ascending: options.direction === 'asc' })
        .range(pagination.offset, pagination.offset + pagination.limit - 1)
  const { data: rawData, error, count } = await orderedQuery

  if (error) throw error
  const hasMore = Boolean(options.keyset && rawData && rawData.length > pageSize)
  const data = options.keyset ? (rawData ?? []).slice(0, pageSize) : rawData
  const paymentIds = (data ?? []).map((row) => String(row.id))
  const { data: documents, error: documentError } = paymentIds.length
    ? await supabaseClient
        .from('verifiable_documents')
        .select('reference_id,verification_code')
        .eq('doc_type', 'invoice')
        .in('reference_id', paymentIds)
    : { data: [], error: null }
  if (documentError) throw documentError
  const verificationCodes = new Map(
    (documents ?? []).map((document) => [document.reference_id, document.verification_code]),
  )
  return {
    data: (data ?? []).map((row) => {
      const student = normalizeJoined(row.students)
      return paymentFromRow({
        ...row,
        student_name: student?.name,
        verification_code: verificationCodes.get(String(row.id)),
      })
    }),
    count: data?.length ?? 0,
    page,
    pageSize,
    totalCount: count ?? 0,
    ...(options.keyset
      ? {
          hasMore,
          nextCursor:
            hasMore && data?.length
              ? encodeCursor({ date: String(data[data.length - 1].payment_date), id: String(data[data.length - 1].id) })
              : null,
        }
      : {}),
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

export async function listCertificates(
  supabaseClient: SupabaseClient,
  options: {
    page?: number
    pageSize?: number
    search?: string
    sort?: 'issue_date' | 'student_name' | 'certificate_id'
    direction?: 'asc' | 'desc'
    categoryId?: string
    course?: string
  } = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 25
  const pagination = pagePagination(page, pageSize)
  let query = supabaseClient.from('certificates').select('*', { count: 'exact' })
  if (options.search) {
    const safeSearch = options.search
      .trim()
      .slice(0, 100)
      .replace(/[\\%_,()]/g, ' ')
    query = query.or(
      `certificate_id.ilike.%${safeSearch}%,student_name.ilike.%${safeSearch}%,course_name.ilike.%${safeSearch}%,student_register_id.eq.${/^\d+$/.test(safeSearch) ? Number(safeSearch) : -1}`,
    )
  }

  if (options.course && options.course.trim()) {
    query = query.eq('course_name', options.course.trim())
  } else if (options.categoryId && options.categoryId.trim()) {
    const { data: coursesInCategory } = await supabaseClient
      .from('courses')
      .select('name')
      .eq('category_id', options.categoryId.trim())
    const names = (coursesInCategory ?? []).map((c: any) => c.name)
    if (names.length > 0) {
      query = query.in('course_name', names)
    } else {
      query = query.eq('course_name', '__no_matching_course__')
    }
  }

  const { data, error, count } = await query
    .order(options.sort ?? 'issue_date', { ascending: options.direction === 'asc' })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)

  if (error) {
    await captureError(error, { function: 'listCertificates' })
    throw error
  }

  const certificateIds = (data ?? []).map((row) => String(row.id))
  const { data: documents, error: documentError } = certificateIds.length
    ? await supabaseClient
        .from('verifiable_documents')
        .select('reference_id,verification_code')
        .eq('doc_type', 'certificate')
        .in('reference_id', certificateIds)
    : { data: [], error: null }
  if (documentError) throw documentError
  const verificationCodes = new Map(
    (documents ?? []).map((document) => [document.reference_id, document.verification_code]),
  )

  const mappedData = (data ?? []).map((row) => ({
    ...row,
    verification_code: verificationCodes.get(String(row.id)),
  }))

  return {
    data: mappedData as CertificateRow[],
    count: mappedData.length,
    page,
    pageSize,
    totalCount: count ?? 0,
  }
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
  },
) {
  const { data, error } = await supabaseClient.from('certificates').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data as CertificateRow
}
