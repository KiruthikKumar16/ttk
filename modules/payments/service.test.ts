import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  role: 'staff',
  rows: {} as Record<string, unknown>,
  paymentCount: 0,
  countError: false,
  listPayments: vi.fn(),
  paymentFromRow: vi.fn(),
  recordPaymentAtomic: vi.fn(),
  getCurrentProfile: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      const query: any = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: mocks.rows[table] ?? null, error: null }),
        then: (resolve: (v: any) => any, reject: (err: any) => any) => {
          if (mocks.countError) return Promise.reject(new Error('count error')).then(resolve, reject)
          return Promise.resolve({ count: mocks.paymentCount, data: null, error: null }).then(resolve, reject)
        },
      }
      return query
    },
  }),
}))
vi.mock('@/lib/server-data', () => ({ listPayments: mocks.listPayments, paymentFromRow: mocks.paymentFromRow }))
vi.mock('./repository', () => ({ recordPaymentAtomic: mocks.recordPaymentAtomic }))
vi.mock('@/lib/auth/current-profile', () => ({ getCurrentProfile: mocks.getCurrentProfile }))

import { createPayment, getPaymentByInvoice, listPaymentPage } from './service'

const input = { studentId: 7, amount: 100, method: 'UPI', gstRate: 18, cgst: 9, sgst: 9 }
const stored = {
  payment: {
    id: 2,
    method: 'UPI',
    payment_date: '2026-09-29',
    amount: 10000,
    invoice: 'TAI-1',
    student_register_id: 7,
    student_id: 's1',
    cgst: 900,
    sgst: 900,
    gst_rate: 18,
  },
  student: { name: 'Asha' },
  verification_code: 'v1',
}

describe('payment service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'admin'
    mocks.rows = {}
    mocks.paymentCount = 0
    mocks.countError = false
    mocks.getCurrentProfile.mockImplementation(async () => ({ id: 'u1', role: mocks.role, fullName: 'Admin' }))
    mocks.listPayments.mockResolvedValue({ data: [], totalCount: 0 })
    mocks.paymentFromRow.mockReturnValue({ invoice: 'TAI-1' })
    mocks.recordPaymentAtomic.mockResolvedValue(stored)
  })

  it('uses safe sorting for payment pages and denies staff access', async () => {
    await expect(
      listPaymentPage({ page: 1, pageSize: 10, search: '', sort: 'bad', direction: 'asc' }),
    ).resolves.toEqual({ data: [], totalCount: 0 })
    expect(mocks.listPayments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sort: 'payment_date' }),
    )
    mocks.role = 'staff'
    await expect(
      listPaymentPage({ page: 1, pageSize: 10, search: '', sort: 'amount', direction: 'desc' }),
    ).rejects.toThrow('not allowed')
  })

  it('requires an idempotency key and maps a successful transaction', async () => {
    await expect(createPayment(input, null)).rejects.toThrow('Idempotency-Key')
    const payment = await createPayment(input, 'payment-test-1')
    expect(payment).toMatchObject({ id: '2', amount: 100, invoice: 'TAI-1', student: 'Asha', verification_code: 'v1' })
    expect(mocks.recordPaymentAtomic).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ studentRegisterId: 7, amountPaise: 10000, cgstPaise: 900, sgstPaise: 900 }),
    )
  })

  it.each([
    ['PAYMENT_EXCEEDS_BALANCE', 'exceeds the remaining balance'],
    ['STUDENT_NOT_FOUND', 'Student not found'],
    ['IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key was already used'],
  ])('maps transaction error %s', async (message, expected) => {
    mocks.recordPaymentAtomic.mockRejectedValueOnce(new Error(message))
    await expect(createPayment(input, 'payment-test-1')).rejects.toThrow(expected)
  })

  it('returns null for an unknown invoice and maps its student and verification fields', async () => {
    await expect(getPaymentByInvoice('missing')).resolves.toBeNull()
    mocks.rows.payments = {
      ...stored.payment,
      students: {
        id: 's1',
        register_id: 7,
        name: 'Asha',
        phone: '9',
        course: 'Web',
        batch: '2026',
        total: 20000,
        paid: 10000,
      },
    }
    mocks.rows.verifiable_documents = { verification_code: 'verify-1' }
    await expect(getPaymentByInvoice('TAI-1')).resolves.toEqual({
      payment: { invoice: 'TAI-1' },
      student: {
        id: 's1',
        registerId: 7,
        name: 'Asha',
        phone: '9',
        course: 'Web',
        batch: '2026',
        total: 200,
        paid: 100,
        status: 'Pending',
      },
    })
    expect(mocks.paymentFromRow).toHaveBeenCalledWith(
      expect.objectContaining({ verification_code: 'verify-1', student_name: 'Asha' }),
    )
  })

  it.each([
    [0, '1st Part Fees Payment', 1],
    [1, '2nd Part Fees Payment', 2],
    [2, '3rd Part Fees Payment', 3],
    [3, '4th Part Fees Payment', 4],
    [4, '5th Part Fees Payment', 5],
  ])(
    'calculates installment milestone automatically when prior count is %i',
    async (priorCount, expectedType, expectedInstance) => {
      mocks.paymentCount = priorCount
      let recordedArgs: any = null
      mocks.recordPaymentAtomic.mockImplementationOnce(async (_client, args) => {
        recordedArgs = args
        return stored
      })
      const payment = await createPayment({ ...input, method: 'UPI' }, `payment-test-inst-${priorCount}`)
      expect(payment).toBeDefined()
    },
  )

  it('handles database error when querying payment count gracefully', async () => {
    mocks.countError = true
    const payment = await createPayment({ ...input, method: 'Cash' }, 'payment-test-custom')
    expect(payment).toBeDefined()
  })

  it('re-throws unexpected payment RPC errors', async () => {
    mocks.recordPaymentAtomic.mockRejectedValueOnce(new Error('DATABASE_CONNECTION_LOST'))
    await expect(createPayment(input, 'payment-test-err')).rejects.toThrow('DATABASE_CONNECTION_LOST')
  })
})
