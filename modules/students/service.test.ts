import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  role: 'staff',
  rows: {} as Record<string, unknown>,
  listStudents: vi.fn(),
  listPayments: vi.fn(),
  studentFromRow: vi.fn(),
  createStudentWithPaymentAtomic: vi.fn(),
  getCurrentProfile: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => ({ data: mocks.rows[table] ?? null, error: null }),
        then: (onfulfilled: any) => Promise.resolve({ data: mocks.rows[table] ?? [], error: null }).then(onfulfilled),
      }
      return query
    },
  }),
}))
vi.mock('@/lib/server-data', () => ({
  listStudents: mocks.listStudents,
  listPayments: mocks.listPayments,
  studentFromRow: mocks.studentFromRow,
}))
vi.mock('./repository', () => ({ createStudentWithPaymentAtomic: mocks.createStudentWithPaymentAtomic }))
vi.mock('@/lib/auth/current-profile', () => ({ getCurrentProfile: mocks.getCurrentProfile }))

import { createStudent, getStudentAcademicHistory, getStudentDetail, listStudentPage } from './service'

const input = {
  name: 'Asha',
  phone: '9000000000',
  course: 'Web',
  batch: '2026-09-29',
  total: 500,
  paid: 0,
  knowledgeTags: [],
}

describe('student service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'staff'
    mocks.rows = {}
    mocks.getCurrentProfile.mockImplementation(async () => ({ id: 'user-1', role: mocks.role, fullName: 'Staff' }))
    mocks.studentFromRow.mockImplementation((row) => ({ registerId: row.register_id, name: row.name, paid: 0 }))
    mocks.listStudents.mockResolvedValue({ data: [], totalCount: 0 })
    mocks.listPayments.mockResolvedValue({ data: [] })
    mocks.createStudentWithPaymentAtomic.mockResolvedValue({
      student: { id: 1, register_id: 1, name: 'Asha', paid: 100, status: 'Pending' },
      initial_payment: null,
    })
  })

  it('checks permissions and delegates a paginated student list', async () => {
    await expect(
      listStudentPage({ page: 1, pageSize: 10, search: '', sort: 'bad', direction: 'asc' }),
    ).resolves.toEqual({ data: [], totalCount: 0 })
    expect(mocks.listStudents).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sort: 'register_id' }))
    mocks.role = 'staff'
    await expect(
      listStudentPage({ page: 1, pageSize: 10, search: '', sort: 'name', direction: 'desc' }),
    ).resolves.toBeDefined()
    mocks.role = 'pending'
    await expect(createStudent(input)).rejects.toThrow('not allowed')
  })

  it('rejects overpayment before invoking the atomic transaction', async () => {
    mocks.role = 'admin'
    await expect(createStudent({ ...input, paid: 501 })).rejects.toThrow('Paid amount cannot exceed total fees.')
    expect(mocks.createStudentWithPaymentAtomic).not.toHaveBeenCalled()
  })

  it('creates a student with the atomic repository and maps an optional initial receipt', async () => {
    mocks.role = 'staff'
    mocks.createStudentWithPaymentAtomic.mockResolvedValueOnce({
      student: { id: 1, register_id: 7, name: 'Asha', paid: 100, status: 'Pending' },
      initial_payment: {
        payment: {
          id: 2,
          method: 'UPI',
          payment_date: '2026-09-29',
          amount: 10000,
          invoice: 'TAI-1',
          student_register_id: 7,
          student_id: 1,
          cgst: 900,
          sgst: 900,
          gst_rate: 18,
        },
        verification_code: 'verify-1',
      },
    })
    const result = await createStudent({ ...input, paid: 100 })
    expect(result.data).toMatchObject({ id: '1', paid: 1, status: 'Pending' })
    expect(result.payment).toMatchObject({
      student: 'Asha',
      amount: 100,
      invoice: 'TAI-1',
      verification_code: 'verify-1',
    })
    expect(mocks.createStudentWithPaymentAtomic).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: 'Asha' }),
      10000,
      expect.any(String),
      expect.any(String),
    )
  })

  it('returns no detail for missing students and combines student and payment data when present', async () => {
    mocks.rows.students = null
    await expect(getStudentDetail(99)).resolves.toBeNull()
    mocks.rows.students = { register_id: 8, name: 'Asha' }
    mocks.listPayments.mockResolvedValueOnce({ data: [{ id: 'p1' }] })
    await expect(getStudentDetail(8)).resolves.toEqual({
      student: { registerId: 8, name: 'Asha', paid: 0 },
      payments: [{ id: 'p1' }],
    })
  })

  it('returns academic history for a student or empty arrays if student missing', async () => {
    mocks.rows.students = { id: 'uuid-1', register_id: 8 }
    mocks.rows.attendance = [{ id: 'att-1', session_date: '2026-09-20', status: 'Present' }]
    mocks.rows.assessment_results = [
      {
        id: 'res-1',
        score: 85,
        remarks: 'Good job',
        graded_at: '2026-09-21',
        assessments: { title: 'JS Test', max_score: 100, assessment_date: '2026-09-21' },
      },
    ]
    const history = await getStudentAcademicHistory(8)
    expect(history.attendance).toEqual([{ id: 'att-1', sessionDate: '2026-09-20', status: 'Present' }])
    expect(history.assessments).toEqual([
      {
        id: 'res-1',
        title: 'JS Test',
        date: '2026-09-21',
        score: 85,
        maxScore: 100,
        remarks: 'Good job',
        gradedAt: '2026-09-21',
      },
    ])

    mocks.rows.students = null
    const emptyHistory = await getStudentAcademicHistory(99)
    expect(emptyHistory).toEqual({ attendance: [], assessments: [] })
  })
})
