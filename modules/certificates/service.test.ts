import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: {} as any,
  listCertificates: vi.fn(),
  getStudentDetail: vi.fn(),
  certData: null as any,
  docData: null as any,
  error: null as any,
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mocks.client }))
vi.mock('@/lib/server-data', () => ({ listCertificates: mocks.listCertificates }))
vi.mock('@/modules/students/service', () => ({ getStudentDetail: mocks.getStudentDetail }))

import { listCertificatePage, getCertificateDetail } from './service'

describe('certificates service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.listCertificates.mockResolvedValue({ data: [], totalCount: 0 })
    mocks.getStudentDetail.mockResolvedValue({
      student: {
        id: 'st-1',
        registerId: 101,
        name: 'Arun Kumar',
        course: 'Python Full Stack',
        batch: '2026-09-01',
        total: 10000,
        paid: 10000,
        phone: '9876543210',
        status: 'Fully Paid',
      },
    })
    mocks.certData = {
      id: 'cert-uuid-1',
      certificate_id: 'CERT-2026-001',
      student_id: 'st-1',
      student_register_id: 101,
      student_name: 'Arun Kumar',
      course_name: 'Python Full Stack',
      start_date: '2026-08-01',
      end_date: '2026-09-01',
      issue_date: '2026-09-02',
      skills: ['Python', 'Django'],
      director_name: 'Director',
      trainer_name: 'Trainer',
    }
    mocks.docData = {
      verification_code: 'VRF-12345',
    }
    mocks.error = null

    mocks.client = {
      from: vi.fn((table: string) => {
        if (table === 'certificates') {
          return {
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: mocks.certData, error: mocks.error })),
              })),
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: mocks.certData, error: mocks.error })),
              })),
            })),
          }
        }
        if (table === 'verifiable_documents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: mocks.docData, error: null })),
                })),
              })),
            })),
          }
        }
        return {}
      }),
    }
  })

  describe('listCertificatePage', () => {
    it('passes valid sort and options to listCertificates', async () => {
      await listCertificatePage({
        page: 1,
        pageSize: 10,
        search: 'Arun',
        sort: 'student_name',
        direction: 'asc',
        categoryId: 'cat-1',
        course: 'Python',
      })
      expect(mocks.listCertificates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          search: 'Arun',
          sort: 'student_name',
          direction: 'asc',
          categoryId: 'cat-1',
          course: 'Python',
        }),
      )
    })

    it('falls back to issue_date if invalid sort is given', async () => {
      await listCertificatePage({
        page: 1,
        pageSize: 10,
        search: '',
        sort: 'invalid_sort',
        direction: 'desc',
      })
      expect(mocks.listCertificates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sort: 'issue_date',
        }),
      )
    })
  })

  describe('getCertificateDetail', () => {
    it('fetches certificate with hyphenated id, verifiable doc, and student detail', async () => {
      const result = await getCertificateDetail('CERT-2026-001')
      expect(result).not.toBeNull()
      expect(result?.certificate.certificateId).toBe('CERT-2026-001')
      expect(result?.certificate.verificationCode).toBe('VRF-12345')
      expect(result?.certificate.skills).toEqual(['Python', 'Django'])
      expect(result?.student.name).toBe('Arun Kumar')
    })

    it('fetches certificate without hyphenated id', async () => {
      const result = await getCertificateDetail('1001')
      expect(result).not.toBeNull()
      expect(result?.certificate.certificateId).toBe('CERT-2026-001')
    })

    it('returns null if certificate is not found or db error occurs', async () => {
      mocks.certData = null
      const notFound = await getCertificateDetail('UNKNOWN')
      expect(notFound).toBeNull()

      mocks.error = new Error('db error')
      const errorResult = await getCertificateDetail('ERROR')
      expect(errorResult).toBeNull()
    })

    it('handles student detail fetch failure with fallback student record', async () => {
      mocks.getStudentDetail.mockRejectedValueOnce(new Error('Student fetch failed'))
      const result = await getCertificateDetail('CERT-2026-001')
      expect(result).not.toBeNull()
      expect(result?.student.name).toBe('Arun Kumar')
      expect(result?.student.registerId).toBe(101)
    })

    it('handles certificate without student_register_id', async () => {
      mocks.certData.student_register_id = null
      const result = await getCertificateDetail('CERT-2026-001')
      expect(result).not.toBeNull()
      expect(result?.student.name).toBe('Arun Kumar')
    })
  })
})
