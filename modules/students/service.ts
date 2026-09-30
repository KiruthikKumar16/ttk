import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { listStudents, listPayments, studentFromRow } from '@/lib/server-data'
import type { Role } from '@/lib/types'
import { can } from '@/lib/auth/permissions'
import { ForbiddenError, ValidationError } from '@/lib/http/errors'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'
import { generateVerificationCode } from '@/lib/utils'
import { createStudentWithPaymentAtomic } from './repository'
import type { CreateStudentInput } from './schema'
import { getCurrentProfile } from '@/lib/auth/current-profile'

function authorizeStudent(role: Role, action: 'read' | 'create') {
  if (!can(role, 'students', action)) throw new ForbiddenError()
}

export async function listStudentPage(options: {
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
  categoryId?: string
  course?: string
}) {
  authorizeStudent((await getCurrentProfile()).role, 'read')
  const supabase = await createClient()
  const allowedSort = ['register_id', 'name', 'created_at'] as const
  const sort = allowedSort.includes(options.sort as (typeof allowedSort)[number])
    ? (options.sort as (typeof allowedSort)[number])
    : 'register_id'
  return listStudents(supabase, {
    ...options,
    sort,
    direction: options.direction,
    categoryId: options.categoryId,
    course: options.course,
  })
}

/** Creates a student and optional first payment through the atomic database workflow. */
export async function createStudent(input: CreateStudentInput) {
  authorizeStudent((await getCurrentProfile()).role, 'create')
  if (input.paid > input.total) throw new ValidationError('Paid amount cannot exceed total fees.')
  const client = await createClient()
  const paymentDate = new Date().toISOString().slice(0, 10)
  const rpcResult = await createStudentWithPaymentAtomic(
    client,
    input,
    rupeesToPaise(input.paid),
    paymentDate,
    generateVerificationCode(10),
  )
  const student = {
    ...studentFromRow(rpcResult.student),
    id: String(rpcResult.student.id),
    paid: paiseToRupees(Number(rpcResult.student.paid)),
    status: rpcResult.student.status as 'Pending' | 'Fully Paid',
  }
  const paymentRow = rpcResult.initial_payment?.payment
  const payment = paymentRow
    ? {
        id: String(paymentRow.id),
        student: input.name,
        method: String(paymentRow.method),
        date: new Date(`${String(paymentRow.payment_date)}T00:00:00`).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        amount: paiseToRupees(Number(paymentRow.amount)),
        invoice: String(paymentRow.invoice),
        studentId: Number(paymentRow.student_register_id),
        studentRowId: String(paymentRow.student_id),
        cgst: paiseToRupees(Number(paymentRow.cgst ?? 0)),
        sgst: paiseToRupees(Number(paymentRow.sgst ?? 0)),
        gstRate: Number(paymentRow.gst_rate ?? 18),
        verification_code: rpcResult.initial_payment?.verification_code,
      }
    : null
  return { message: 'Student created successfully', data: student, payment }
}

export async function getStudentDetail(registerId: number) {
  authorizeStudent((await getCurrentProfile()).role, 'read')
  const supabase = await createClient()
  const { data: row, error } = await supabase.from('students').select('*').eq('register_id', registerId).maybeSingle()
  if (error) throw error
  if (!row) return null
  const [studentResult, paymentResult] = await Promise.all([
    Promise.resolve(studentFromRow(row)),
    listPayments(supabase, { page: 1, pageSize: 100, studentId: registerId }),
  ])
  return { student: studentResult, payments: paymentResult.data }
}
