import { z } from 'zod'
import { paymentSchema } from '@/lib/validation'

export const recordPaymentSchema = paymentSchema
export const idempotencyKeySchema = z.string().trim().min(1).max(200)
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
