import { describe, expect, it } from 'vitest'
import { attendanceSchema, paymentSchema, studentSchema } from './validation'

describe('validation schemas', () => {
  it('accepts valid student and payment payloads and rejects invalid boundaries', () => {
    expect(studentSchema.safeParse({ name: 'Asha', phone: '9876543210', total: 10000 }).success).toBe(true)
    expect(studentSchema.safeParse({ name: '', phone: '', total: 0 }).success).toBe(false)
    expect(paymentSchema.safeParse({ studentId: 1, amount: 1, method: 'UPI', date: '2026-03-31' }).success).toBe(true)
    expect(paymentSchema.safeParse({ studentId: 0, amount: 0, method: '', date: '31/03/2026' }).success).toBe(false)
  })

  it('accepts only the supported attendance statuses and ISO session dates', () => {
    const base = { studentId: 1, courseId: 'CRS-01', sessionDate: '2026-03-31' }
    expect(attendanceSchema.safeParse({ ...base, status: 'Excused' }).success).toBe(true)
    expect(attendanceSchema.safeParse({ ...base, status: 'Tardy' }).success).toBe(false)
    expect(attendanceSchema.safeParse({ ...base, sessionDate: '31/03/2026', status: 'Present' }).success).toBe(false)
  })
})
