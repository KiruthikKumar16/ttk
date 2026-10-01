import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { paymentFromRow } from '@/lib/server-data'
import { listPayments } from '@/lib/server-data'
import { paiseToRupees } from '@/lib/money'
import { createHash } from 'node:crypto'
import type { Role } from '@/lib/types'
import { can } from '@/lib/auth/permissions'
import { ForbiddenError, ConflictError, NotFoundError, ValidationError } from '@/lib/http/errors'
import { rupeesToPaise } from '@/lib/money'
import { generateVerificationCode } from '@/lib/utils'
import { idempotencyKeySchema, type RecordPaymentInput } from './schema'
import { recordPaymentAtomic } from './repository'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { createNotification } from '@/modules/notifications/service'

function authorizePayment(role: Role, action: 'read' | 'create') {
  if (!can(role, 'payments', action)) throw new ForbiddenError()
}

function paymentRpcError(error: unknown): never {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('PAYMENT_EXCEEDS_BALANCE')) throw new ValidationError('Payment exceeds the remaining balance.')
  if (message.includes('STUDENT_NOT_FOUND')) throw new NotFoundError('Student not found.')
  if (message.includes('IDEMPOTENCY_KEY_REUSED'))
    throw new ConflictError('Idempotency-Key was already used for a different request.')
  throw error
}

export async function listPaymentPage(options: {
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
  date?: string
  keyset?: boolean
  cursor?: string
}) {
  authorizePayment((await getCurrentProfile()).role, 'read')
  const supabase = await createClient()
  const sort = ['payment_date', 'amount', 'invoice'].includes(options.sort)
    ? (options.sort as 'payment_date' | 'amount' | 'invoice')
    : 'payment_date'
  return listPayments(supabase, {
    ...options,
    sort,
    direction: options.direction,
    keyset: options.keyset,
    cursor: options.cursor,
  })
}

/**
 * Records a payment with a required idempotency key. The database RPC locks the
 * student balance and commits the payment, paid amount, invoice, and verification
 * record atomically; replaying the same key and body returns the original result.
 */
export async function createPayment(input: RecordPaymentInput, idempotencyKey: string | null) {
  authorizePayment((await getCurrentProfile()).role, 'create')
  const key = idempotencyKeySchema.safeParse(idempotencyKey)
  if (!key.success) throw new ValidationError('The Idempotency-Key header is required.')
  const client = await createClient()
  const payload = JSON.stringify(input)
  const hash = createHash('sha256').update(payload).digest('hex')
  try {
    const result = await recordPaymentAtomic(client, {
      key: key.data,
      hash,
      studentRegisterId: input.studentId,
      amountPaise: rupeesToPaise(input.amount),
      method: input.method,
      date: input.date ?? new Date().toISOString().slice(0, 10),
      transactionId: input.transactionId ?? null,
      customNote: input.customNote ?? null,
      gstRate: input.gstRate,
      cgstPaise: rupeesToPaise(input.cgst ?? 0),
      sgstPaise: rupeesToPaise(input.sgst ?? 0),
      verificationCode: generateVerificationCode(10),
    })
    const paymentRecord = {
      id: String(result.payment.id),
      student: String(result.student.name),
      method: String(result.payment.method),
      date: new Date(`${String(result.payment.payment_date)}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      amount: paiseToRupees(Number(result.payment.amount)),
      invoice: String(result.payment.invoice),
      studentId: Number(result.payment.student_register_id),
      studentRowId: String(result.payment.student_id),
      cgst: paiseToRupees(Number(result.payment.cgst ?? 0)),
      sgst: paiseToRupees(Number(result.payment.sgst ?? 0)),
      transactionId: result.payment.transaction_id ? String(result.payment.transaction_id) : null,
      customNote: result.payment.custom_note ? String(result.payment.custom_note) : null,
      gstRate: Number(result.payment.gst_rate ?? 0),
      verification_code: result.verification_code,
    }

    void createNotification(
      {
        recipientRole: 'admin',
        title: 'Fee Payment Received',
        message: `Invoice ${String(result.payment.invoice)} recorded for ₹${(Number(result.payment.amount) / 100).toLocaleString('en-IN')} (${String(result.student.name)}).`,
        type: 'info',
        link: `/invoices/${encodeURIComponent(String(result.payment.invoice))}`,
        entityType: 'payment',
        entityId: String(result.payment.id),
      },
      client,
    )

    return paymentRecord
  } catch (error) {
    paymentRpcError(error)
  }
}

export async function getPaymentByInvoice(invoice: string) {
  authorizePayment((await getCurrentProfile()).role, 'read')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*,students!payments_student_id_fkey(id,register_id,name,phone,course,batch,total,paid)')
    .eq('invoice', invoice)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const { data: document, error: documentError } = await supabase
    .from('verifiable_documents')
    .select('verification_code')
    .eq('doc_type', 'invoice')
    .eq('reference_id', String(data.id))
    .maybeSingle()
  if (documentError) throw documentError
  const studentRow = Array.isArray(data.students) ? data.students[0] : data.students
  const payment = paymentFromRow({
    ...data,
    student_name: studentRow?.name,
    student_register_id: studentRow?.register_id,
    verification_code: document?.verification_code,
  })
  const student = studentRow
    ? {
        id: String(studentRow.id),
        registerId: Number(studentRow.register_id),
        name: String(studentRow.name),
        phone: String(studentRow.phone ?? ''),
        course: String(studentRow.course),
        batch: String(studentRow.batch),
        total: paiseToRupees(Number(studentRow.total)),
        paid: paiseToRupees(Number(studentRow.paid)),
        status: Number(studentRow.paid) >= Number(studentRow.total) ? ('Fully Paid' as const) : ('Pending' as const),
      }
    : null
  return { payment, student }
}
