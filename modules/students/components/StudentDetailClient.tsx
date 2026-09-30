'use client'

import { useRouter } from 'next/navigation'
import type { Course, Payment, Student } from '@/lib/types'
import type { Receipt } from '@/lib/types'
import { StudentDetail } from '@/modules/students/components/StudentDetail'
import { useRef } from 'react'
import { useRecordPaymentMutation } from '@/lib/query/mutations'

export function StudentDetailClient({
  student,
  payments,
  courses,
  gstRate,
  canRecordPayment,
}: {
  student: Student
  payments: Payment[]
  courses: Course[]
  gstRate: number
  canRecordPayment: boolean
}) {
  const router = useRouter()
  const recordPayment = useRecordPaymentMutation(student.registerId)
  const paymentKey = useRef<string | null>(null)
  return (
    <StudentDetail
      student={student}
      payments={payments}
      courses={courses}
      gstRate={gstRate}
      canRecordPayment={canRecordPayment}
      onBack={() => router.back()}
      onCertificate={() => router.push(`/students/${student.registerId}/certificate`)}
      onInvoice={(payment) => router.push(`/invoices/${encodeURIComponent(payment.invoice)}`)}
      onPayment={async (amount, method): Promise<Receipt | string> => {
        paymentKey.current ??= crypto.randomUUID()
        let result
        try {
          result = await recordPayment.mutateAsync({
            body: { studentId: student.registerId, amount, method, date: new Date().toISOString().slice(0, 10) },
            idempotencyKey: paymentKey.current,
          })
        } catch (error) {
          return error instanceof Error ? error.message : 'Unable to record payment.'
        }
        paymentKey.current = null
        router.refresh()
        return result.data as Receipt
      }}
    />
  )
}
