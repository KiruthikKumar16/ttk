import { describe, expect, it, vi } from 'vitest'

const captureError = vi.hoisted(() => vi.fn())
vi.mock('@/lib/errorReporting', () => ({ captureError }))

import {
  insertCertificate,
  listCertificates,
  listPayments,
  listStudents,
  paymentFromRow,
  studentFromRow,
} from './server-data'

type QueryResult = { data?: any; error?: any; count?: number | null }
function clientWith(results: Record<string, QueryResult[]>) {
  const inserted: unknown[] = []
  const client = {
    from(table: string) {
      const result = (results[table] ?? []).shift() ?? { data: [], error: null, count: 0 }
      const query: any = {}
      for (const method of ['select', 'eq', 'or', 'in', 'order', 'range', 'limit']) query[method] = vi.fn(() => query)
      query.insert = vi.fn((row) => {
        inserted.push(row)
        return query
      })
      query.single = vi.fn(async () => result)
      query.then = (resolve: (value: QueryResult) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject)
      return query
    },
  }
  return { client: client as any, inserted }
}

describe('server data mapping and pagination', () => {
  it('maps student paise values, status, optional details and unknown gender', () => {
    expect(
      studentFromRow({
        register_id: 4,
        name: 'Asha',
        course: 'Web',
        batch: '2026',
        total: 10001,
        paid: 10001,
        gender: 'Other',
        phone: null,
        knowledge_tags: ['JS'],
        city: 'Tuticorin',
      }),
    ).toMatchObject({
      registerId: 4,
      total: 100.01,
      paid: 100.01,
      status: 'Fully Paid',
      gender: undefined,
      phone: '',
      knowledgeTags: ['JS'],
      city: 'Tuticorin',
    })
    expect(
      studentFromRow({
        register_id: 5,
        name: 'Bala',
        course: 'AI',
        batch: '2026',
        total: 10000,
        paid: 0,
        gender: 'Female',
        dob: '2000-01-01',
        alt_phone: '9',
        marital_status: 'Single',
        email: 'a@b.test',
        country: 'India',
        state: 'TN',
        area: 'North',
        lead_source: 'Walk-in',
        comments: 'note',
      }),
    ).toMatchObject({
      status: 'Pending',
      gender: 'Female',
      dob: '2000-01-01',
      altPhone: '9',
      maritalStatus: 'Single',
      email: 'a@b.test',
      country: 'India',
      state: 'TN',
      area: 'North',
      studentSource: 'Walk-in',
      comments: 'note',
    })
  })

  it('maps payment aliases, defaults and optional GST details', () => {
    expect(
      paymentFromRow({
        id: 1,
        method: 'Cash',
        amount: 10050,
        date: '2026-01-01',
        student_id: 42,
        student: 'Asha',
        invoice: null,
      }),
    ).toMatchObject({ id: '1', amount: 100.5, studentId: 42, student: 'Asha', invoice: '' })
    expect(
      paymentFromRow({
        id: 2,
        method: 'UPI',
        amount: 10000,
        payment_date: '2026-01-01',
        student_register_id: 7,
        gstRate: 5,
        cgst: 250,
        sgst: 250,
        transaction_id: 'tx',
        custom_note: 'note',
        verification_code: 'v',
      }),
    ).toMatchObject({
      amount: 100,
      gstRate: 5,
      cgst: 2.5,
      sgst: 2.5,
      transactionId: 'tx',
      customNote: 'note',
      verification_code: 'v',
    })
  })

  it('lists and searches students with pagination, sanitization and numeric register IDs', async () => {
    const fixture = clientWith({
      students: [
        { data: [{ register_id: 20, name: 'Asha', course: 'Web', batch: '2026', total: 10000, paid: 0 }], count: 1 },
      ],
    })
    await expect(
      listStudents(fixture.client, { page: 2, pageSize: 10, search: ' 20 ', direction: 'asc' }),
    ).resolves.toMatchObject({ page: 2, pageSize: 10, totalCount: 1, data: [{ registerId: 20 }] })
    await expect(listStudents(fixture.client, { page: 0 })).rejects.toThrow('Page must be a positive integer.')
    const errorClient = clientWith({ students: [{ error: new Error('students unavailable') }] })
    await expect(listStudents(errorClient.client)).rejects.toThrow('students unavailable')
  })

  it('lists payments, applies filters, resolves invoice verification and propagates query errors', async () => {
    const fixture = clientWith({
      payments: [
        {
          data: [
            {
              id: 1,
              amount: 2500,
              method: 'UPI',
              invoice: 'INV-1',
              payment_date: '2026-01-01',
              student_register_id: 9,
              students: [{ name: 'Asha' }],
            },
          ],
          count: 1,
        },
      ],
      students: [{ data: [{ register_id: 9 }] }],
      verifiable_documents: [{ data: [{ reference_id: '1', verification_code: 'verify-1' }] }],
    })
    await expect(
      listPayments(fixture.client, { search: 'Asha', studentId: 9, date: '2026-01-01', page: 1 }),
    ).resolves.toMatchObject({ totalCount: 1, data: [{ student: 'Asha', amount: 25, verification_code: 'verify-1' }] })
    const empty = clientWith({ payments: [{ data: [], count: null }] })
    await expect(listPayments(empty.client)).resolves.toMatchObject({ count: 0, totalCount: 0, data: [] })
    const broken = clientWith({ payments: [{ error: new Error('payment query') }] })
    await expect(listPayments(broken.client)).rejects.toThrow('payment query')
    const docError = clientWith({
      payments: [{ data: [{ id: 1 }], count: 1 }],
      verifiable_documents: [{ error: new Error('document query') }],
    })
    await expect(listPayments(docError.client)).rejects.toThrow('document query')
  })

  it('lists certificates with verification codes, reports failures and inserts a certificate', async () => {
    const fixture = clientWith({
      certificates: [{ data: [{ id: 'c1', certificate_id: 'CERT-1' }], count: 1 }],
      verifiable_documents: [{ data: [{ reference_id: 'c1', verification_code: 'verify-c1' }] }],
    })
    await expect(listCertificates(fixture.client, { search: 'CERT-1', sort: 'student_name' })).resolves.toMatchObject({
      totalCount: 1,
      data: [{ verification_code: 'verify-c1' }],
    })
    const failed = clientWith({ certificates: [{ error: new Error('certificate query') }] })
    await expect(listCertificates(failed.client)).rejects.toThrow('certificate query')
    expect(captureError).toHaveBeenCalledOnce()
    const fixtureInsert = clientWith({ certificates: [{ data: { id: 'c2' } }] })
    await expect(
      insertCertificate(fixtureInsert.client, {
        certificate_id: 'CERT-2',
        student_id: 's2',
        student_register_id: 5,
        course_name: 'AI',
        student_name: 'Meena',
      }),
    ).resolves.toEqual({ id: 'c2' })
    expect(fixtureInsert.inserted).toEqual([expect.objectContaining({ certificate_id: 'CERT-2' })])
    const failedInsert = clientWith({ certificates: [{ error: { message: 'duplicate certificate' } }] })
    await expect(
      insertCertificate(failedInsert.client, {
        certificate_id: 'CERT-2',
        student_id: 's2',
        student_register_id: 5,
        course_name: 'AI',
        student_name: 'Meena',
      }),
    ).rejects.toThrow('duplicate certificate')
  })
})
