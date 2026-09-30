import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  results: {} as Record<string, { data?: any; error?: Error | null }[]>,
  client: {} as any,
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mocks.client }))

import { getAllStudents, getAllPayments, getStaffAcademicReportData } from './service'

function setResults(table: string, ...results: { data?: any; error?: Error | null }[]) {
  mocks.results[table] = results
}

function makeClient() {
  return {
    from: vi.fn((table: string) => {
      const queue = mocks.results[table] ?? []
      const current = queue.shift() ?? { data: [], error: null }
      const query: any = {}
      for (const method of ['select', 'order', 'limit', 'eq']) {
        query[method] = vi.fn(() => query)
      }
      query.then = (resolve: (value: any) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve(current).then(resolve, reject)
      return query
    }),
  }
}

describe('reports service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.results = {}
    mocks.client = makeClient()
  })

  it('fetches all students and maps them', async () => {
    setResults('students', {
      data: [
        {
          id: 's1',
          register_id: 101,
          name: 'Jane Doe',
          course: 'Design',
          joining_date: '2026-01-01',
          total_fees: 50000,
          pending_fees: 10000,
          status: 'Active',
          email: 'jane@example.com',
          phone: '9876543210',
        },
      ],
      error: null,
    })

    const students = await getAllStudents()
    expect(students).toHaveLength(1)
    expect(students[0].name).toBe('Jane Doe')
    expect(students[0].registerId).toBe(101)
  })

  it('throws on error when fetching all students', async () => {
    setResults('students', { data: null, error: new Error('student db err') })
    await expect(getAllStudents()).rejects.toThrow('student db err')
  })

  it('fetches all payments and maps student names', async () => {
    setResults('payments', {
      data: [
        {
          id: 'p1',
          student_id: 's1',
          student_register_id: 101,
          method: 'UPI',
          amount: 25000,
          invoice: 'INV-001',
          payment_date: '2026-02-01',
          transaction_id: 'TX123',
          custom_note: null,
          gst_rate: 18,
          cgst: 2250,
          sgst: 2250,
          students: { id: 's1', name: 'Jane Doe' },
        },
      ],
      error: null,
    })

    const payments = await getAllPayments()
    expect(payments).toHaveLength(1)
    expect(payments[0].invoice).toBe('INV-001')
    expect(payments[0].student).toBe('Jane Doe')
  })

  it('throws on error when fetching all payments', async () => {
    setResults('payments', { data: null, error: new Error('payment db err') })
    await expect(getAllPayments()).rejects.toThrow('payment db err')
  })

  it('fetches and maps academic report data for staff', async () => {
    setResults('attendance', {
      data: [
        {
          id: 'att-1',
          session_date: '2026-09-30',
          status: 'Present',
          course_id: 'c1',
          student_id: 's1',
          students: { register_id: 101, name: 'Jane Doe' },
          courses: { name: 'Full Stack' },
        },
      ],
      error: null,
    })

    setResults('assessments', {
      data: [
        {
          id: 'ass-1',
          title: 'Midterm',
          max_score: 100,
          assessment_date: '2026-09-25',
          course_id: 'c1',
          courses: { name: 'Full Stack' },
        },
      ],
      error: null,
    })

    setResults('assessment_results', {
      data: [
        { id: 'res-1', assessment_id: 'ass-1', student_id: 's1', score: 85 },
        { id: 'res-2', assessment_id: 'ass-1', student_id: 's2', score: 35 },
      ],
      error: null,
    })

    const report = await getStaffAcademicReportData()
    expect(report.attendanceRecords).toHaveLength(1)
    expect(report.attendanceRecords[0].studentName).toBe('Jane Doe')
    expect(report.attendanceRecords[0].status).toBe('Present')

    expect(report.assessmentRecords).toHaveLength(1)
    expect(report.assessmentRecords[0].title).toBe('Midterm')
    expect(report.assessmentRecords[0].resultsCount).toBe(2)
    expect(report.assessmentRecords[0].passCount).toBe(1)
    expect(report.assessmentRecords[0].failCount).toBe(1)
    expect(report.assessmentRecords[0].avgScore).toBe(60)
  })

  it('throws on errors in getStaffAcademicReportData', async () => {
    setResults('attendance', { data: null, error: new Error('att fail') })
    setResults('assessments', { data: [], error: null })
    setResults('assessment_results', { data: [], error: null })
    await expect(getStaffAcademicReportData()).rejects.toThrow('att fail')
  })
})
