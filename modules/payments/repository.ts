import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AtomicPaymentInput = {
  key: string
  hash: string
  studentRegisterId: number
  amountPaise: number
  method: string
  date: string
  transactionId: string | null
  customNote: string | null
  gstRate: number
  cgstPaise: number
  sgstPaise: number
  verificationCode: string
}

export async function recordPaymentAtomic(client: SupabaseClient, input: AtomicPaymentInput) {
  const { data, error } = await client.rpc('record_payment_idempotent', {
    p_idempotency_key: input.key,
    p_request_hash: input.hash,
    p_student_register_id: input.studentRegisterId,
    p_amount: input.amountPaise,
    p_method: input.method,
    p_payment_date: input.date,
    p_transaction_id: input.transactionId,
    p_custom_note: input.customNote,
    p_gst_rate: input.gstRate,
    p_cgst: input.cgstPaise,
    p_sgst: input.sgstPaise,
    p_verification_code: input.verificationCode,
  })
  if (error) throw error
  return data as { payment: Record<string, unknown>; student: Record<string, unknown>; verification_code: string }
}
