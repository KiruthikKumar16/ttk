'use client'

import { useRouter } from 'next/navigation'
import type { Course, Payment, Student, Role } from '@/lib/types'
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
  role = 'admin',
  attendance = [],
  assessments = [],
}: {
  student: Student
  payments: Payment[]
  courses: Course[]
  gstRate: number
  canRecordPayment: boolean
  role?: Role
  attendance?: { id: string; sessionDate: string; status: 'Present' | 'Absent' | 'Late' | 'Excused' }[]
  assessments?: {
    id: string
    title: string
    date: string
    score: number
    maxScore: number
    remarks?: string | null
    gradedAt?: string | null
  }[]
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
      role={role}
      attendance={attendance}
      assessments={assessments}
      onBack={() => router.back()}
      onCertificate={() => router.push(`/students/${student.registerId}/certificate`)}
      onInvoice={(payment) => router.push(`/invoices/${encodeURIComponent(payment.invoice)}`)}
      onPayment={async (amount, method, paymentType): Promise<Receipt | string> => {
        paymentKey.current ??= crypto.randomUUID()
        let result
        try {
          result = await recordPayment.mutateAsync({
            body: {
              studentId: student.registerId,
              amount,
              method,
              paymentType,
              date: new Date().toISOString().slice(0, 10),
            },
            idempotencyKey: paymentKey.current,
          })
        } catch (error) {
          return error instanceof Error ? error.message : 'Unable to record payment.'
        }
        paymentKey.current = null
        router.refresh()
        const receipt = result.data as Receipt
        if (receipt?.invoice) {
          router.push(`/invoices/${encodeURIComponent(receipt.invoice)}`)
        }
        return receipt
      }}
    />
  )
}
