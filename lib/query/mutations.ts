'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Payment, Student } from '@/lib/types'

export type CreateStudentResult = { message: string; data: Student; payment: Payment | null }
export type RecordPaymentResult = Payment

export function useCreateStudentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (student: unknown) => apiClient.post<CreateStudentResult, unknown>('/api/students', student),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useRecordPaymentMutation(studentRegisterId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: unknown; idempotencyKey: string }) =>
      apiClient.post<RecordPaymentResult, unknown>('/api/payments', body, { idempotencyKey }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        ...(studentRegisterId === undefined
          ? []
          : [queryClient.invalidateQueries({ queryKey: ['student', studentRegisterId] })]),
      ])
    },
  })
}
