import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateStudentInput } from './schema'
import { rupeesToPaise } from '@/lib/money'

export async function createStudentWithPaymentAtomic(
  client: SupabaseClient,
  student: CreateStudentInput,
  initialPaymentPaise: number,
  paymentDate: string,
  verificationCode: string,
) {
  const { data, error } = await client.rpc('create_student_with_payment', {
    p_student: {
      name: student.name,
      phone: student.phone,
      course: student.course,
      batch: student.batch,
      total: rupeesToPaise(student.total),
      gender: student.gender ?? null,
      dob: student.dob ?? null,
      alt_phone: student.altPhone ?? null,
      marital_status: student.maritalStatus ?? null,
      email: student.email ?? null,
      country: student.country ?? null,
      state: student.state ?? null,
      city: student.city ?? null,
      area: student.area ?? null,
      lead_source: student.studentSource ?? null,
      comments: student.comments ?? null,
      knowledge_tags: student.knowledgeTags ?? [],
    },
    p_initial_payment_amount: initialPaymentPaise,
    p_initial_payment_date: paymentDate,
    p_verification_code: verificationCode,
  })
  if (error) throw error
  return data as {
    student: Record<string, unknown>
    initial_payment: {
      payment: Record<string, unknown>
      student: Record<string, unknown>
      verification_code: string
    } | null
  }
}
