import { beforeEach, describe, expect, it, vi } from 'vitest'

type Result = { data?: any; error?: Error | null; count?: number | null }
const mocks = vi.hoisted(() => ({
  results: {} as Record<string, Result[]>,
  client: {} as any,
  adminClient: {} as any,
  listCertificates: vi.fn(),
  getCurrentProfile: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mocks.client }))
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdminClient: () => mocks.adminClient }))
vi.mock('@/lib/auth/current-profile', () => ({ getCurrentProfile: mocks.getCurrentProfile }))
vi.mock('next/cache', () => ({
  unstable_cache: (callback: (...args: any[]) => any) => callback,
  revalidateTag: vi.fn(),
}))
vi.mock('@/lib/server-data', () => ({ listCertificates: mocks.listCertificates }))

import { getCachedGstCalculationSettings, getGstSettings } from '@/modules/gst/service'
import {
  getCachedCourseOptions,
  listCoursePage,
  getCourse,
  listCourseOptions,
  listCourseCategories,
  createCourseCategory,
  updateCourseCategory,
  deleteCourseCategory,
} from '@/modules/courses/service'
import { listAttendancePage } from '@/modules/attendance/service'
import { listAssessmentPage } from '@/modules/assessments/service'
import { listAuditPage } from '@/modules/audit/service'
import { listCertificatePage } from '@/modules/certificates/service'
import { listCourseMaterials } from '@/modules/materials/service'
import { ForbiddenError, NotFoundError } from '@/lib/http/errors'
import { encodeCursor } from '@/lib/pagination'

function setResults(table: string, ...results: Result[]) {
  mocks.results[table] = results
}

function makeClient() {
  const storage = {
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.test/file' }, error: null }),
  }
  return {
    from: vi.fn((table: string) => {
      let current: Result = { data: [], error: null, count: 0 }
      const queue = mocks.results[table] ?? []
      current = queue.shift() ?? current
      const query: any = {}
      for (const method of [
        'select',
        'eq',
        'ilike',
        'or',
        'order',
        'range',
        'limit',
        'insert',
        'update',
        'delete',
        'is',
      ])
        query[method] = vi.fn(() => query)
      query.maybeSingle = vi.fn(async () => current)
      query.single = vi.fn(async () => current)
      query.then = (resolve: (value: Result) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve(current).then(resolve, reject)
      return query
    }),
    storage: { from: vi.fn(() => storage) },
    storageBucket: storage,
  }
}

const opts = { page: 2, pageSize: 5, search: '  Web_  ', sort: 'unsafe', direction: 'desc' as const }

describe('read-only domain services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.results = {}
    mocks.client = makeClient()
    mocks.adminClient = makeClient()
    mocks.getCurrentProfile.mockResolvedValue({ role: 'admin' })
  })

  it('returns GST settings and null for an unset row', async () => {
    setResults('gst_settings', { data: { rate: '18', gstin: null, enabled: true }, error: null })
    await expect(getGstSettings()).resolves.toEqual({ rate: 18, gstin: null, enabled: true })
    setResults('gst_settings', { data: null, error: null })
    await expect(getGstSettings()).resolves.toBeNull()
    setResults('gst_settings', { data: null, error: new Error('db') })
    await expect(getGstSettings()).rejects.toThrow('db')
  })

  it('caches the non-sensitive GST calculation fields and handles missing rows/errors', async () => {
    setResults('gst_settings', { data: { rate: '5', enabled: false }, error: null })
    await expect(getCachedGstCalculationSettings()).resolves.toEqual({ rate: 5, enabled: false })
    setResults('gst_settings', { data: null, error: null })
    await expect(getCachedGstCalculationSettings()).resolves.toBeNull()
    setResults('gst_settings', { data: null, error: new Error('cache read failed') })
    await expect(getCachedGstCalculationSettings()).rejects.toThrow('cache read failed')
  })

  it('maps course lists, validates sorts, returns a single course and course options', async () => {
    setResults('courses', {
      data: [{ id: 'C1', name: 'Web', fee: 12345, duration: '3m', description: null, gst_inclusive: false }],
      count: 1,
    })
    await expect(listCoursePage(opts)).resolves.toEqual({
      data: [{ id: 'C1', name: 'Web', fee: 123.45, duration: '3m', description: undefined, gstInclusive: false }],
      totalCount: 1,
    })
    setResults('courses', {
      data: { id: 'C1', name: 'Web', fee: 10000, duration: '2m', description: 'd', gst_inclusive: true },
    })
    await expect(getCourse('C1')).resolves.toMatchObject({ fee: 100, gstInclusive: true })
    setResults('courses', { data: [{ id: 'C1', name: 'Web', fee: 10000, duration: '2m', gst_inclusive: true }] })
    await expect(listCourseOptions()).resolves.toHaveLength(1)
    setResults('courses', { error: new Error('query failed') })
    await expect(listCoursePage(opts)).rejects.toThrow('query failed')
  })

  it('checks course-read permission before reading cached course options', async () => {
    setResults('courses', {
      data: [{ id: 'C1', name: 'Web', fee: 25000, duration: '2m', description: null, gst_inclusive: false }],
      error: null,
    })
    await expect(getCachedCourseOptions()).resolves.toEqual([
      { id: 'C1', name: 'Web', fee: 250, duration: '2m', description: undefined, gstInclusive: false },
    ])

    setResults('courses', { data: null, error: new Error('cached read failed') })
    await expect(getCachedCourseOptions()).rejects.toThrow('cached read failed')

    mocks.getCurrentProfile.mockResolvedValueOnce({ role: null })
    await expect(getCachedCourseOptions()).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('manages course categories with authorization checks', async () => {
    setResults('course_categories', {
      data: [
        {
          id: 'cat-1',
          name: 'Tech',
          duration: '3m',
          created_at: '2026-01-01',
          updated_at: '2026-01-02',
          courses: [{ count: 2 }],
        },
      ],
      error: null,
    })
    const categories = await listCourseCategories()
    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Tech')
    expect(categories[0].courseCount).toBe(2)

    setResults('course_categories', {
      data: { id: 'cat-2', name: 'Design', duration: '6m', created_at: 'now', updated_at: 'now' },
      error: null,
    })
    const created = await createCourseCategory({ name: 'Design', duration: '6m' })
    expect(created.name).toBe('Design')

    mocks.getCurrentProfile.mockResolvedValueOnce({ role: 'staff' })
    await expect(createCourseCategory({ name: 'X', duration: '1m' })).rejects.toBeInstanceOf(ForbiddenError)

    setResults('course_categories', {
      data: { id: 'cat-2', name: 'Design Updated', duration: '8m', created_at: 'now', updated_at: 'now' },
      error: null,
    })
    const updated = await updateCourseCategory('cat-2', { name: 'Design Updated' })
    expect(updated.name).toBe('Design Updated')

    mocks.getCurrentProfile.mockResolvedValueOnce({ role: 'staff' })
    await expect(updateCourseCategory('cat-2', {})).rejects.toBeInstanceOf(ForbiddenError)

    setResults('course_categories', { error: null })
    await expect(deleteCourseCategory('cat-2')).resolves.toBeUndefined()

    mocks.getCurrentProfile.mockResolvedValueOnce({ role: 'staff' })
    await expect(deleteCourseCategory('cat-2')).rejects.toBeInstanceOf(ForbiddenError)

    // Also test category filtering in listCoursePage
    setResults('courses', { data: [], count: 0 })
    await listCoursePage({ ...opts, categoryId: 'uncategorized' })
    setResults('courses', { data: [], count: 0 })
    await listCoursePage({ ...opts, categoryId: 'cat-1' })
  })

  it('maps attendance, assessment and audit rows and applies searches', async () => {
    setResults('attendance', {
      count: 1,
      data: [
        {
          id: 1,
          student_id: 2,
          course_id: 'C1',
          session_date: '2026-09-29',
          status: 'Present',
          students: [{ register_id: 9, name: 'Asha' }],
          courses: { id: 'C1', name: 'Web' },
          profiles: { full_name: 'Trainer' },
        },
      ],
    })
    await expect(listAttendancePage({ ...opts })).resolves.toMatchObject({
      totalCount: 1,
      data: [{ id: '1', studentId: 9, studentName: 'Asha', markedBy: 'Trainer' }],
    })
    setResults('assessments', {
      count: 0,
      data: [
        {
          id: 1,
          course_id: 'C1',
          title: 'Quiz',
          max_score: 10,
          assessment_date: '2026-09-29',
          created_at: '2026-09-29',
          courses: null,
          profiles: null,
        },
      ],
    })
    await expect(listAssessmentPage({ page: 1, pageSize: 5, search: 'Quiz', courseId: 'C1' })).resolves.toMatchObject({
      data: [{ courseName: '', title: 'Quiz', createdBy: null }],
    })
    setResults('audit_log', {
      count: 1,
      data: [{ id: 1, table_name: 'students', record_id: '3', action: 'INSERT', changed_at: 'now', profiles: null }],
    })
    await expect(listAuditPage({ page: 1, pageSize: 5, search: 'student', direction: 'asc' })).resolves.toMatchObject({
      data: [{ tableName: 'students', actor: expect.any(String) }],
    })
    setResults('audit_log', {
      count: 1,
      data: [
        {
          id: 2,
          table_name: 'students',
          record_id: '4',
          action: 'update',
          changed_at: 'now',
          profiles: { full_name: 'Admin', role: 'admin' },
        },
      ],
    })
    await expect(
      listAuditPage({
        page: 1,
        pageSize: 5,
        search: '',
        direction: 'desc',
        tableName: 'students',
        action: 'update',
        userId: '00000000-0000-4000-8000-000000000001',
        userName: 'Admin',
      }),
    ).resolves.toMatchObject({
      data: [{ tableName: 'students', actor: 'Admin', actorRole: 'admin', action: 'update' }],
    })
    setResults('attendance', { error: new Error('database') })
    await expect(listAttendancePage({ ...opts })).rejects.toThrow('database')
  })

  it('uses validated keyset cursors and returns the next cursor for history lists', async () => {
    setResults('attendance', {
      data: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          student_id: '00000000-0000-4000-8000-000000000010',
          course_id: 'C1',
          session_date: '2026-09-29',
          status: 'Present',
          students: { register_id: 9, name: 'Asha' },
          courses: { name: 'Web' },
          profiles: { full_name: 'Trainer' },
        },
        {
          id: '00000000-0000-4000-8000-000000000001',
          student_id: '00000000-0000-4000-8000-000000000011',
          course_id: 'C1',
          session_date: '2026-09-28',
          status: 'Late',
          students: { register_id: 10, name: 'Meera' },
          courses: { name: 'Web' },
          profiles: null,
        },
      ],
    })
    const attendance = await listAttendancePage({
      page: 1,
      pageSize: 1,
      search: '',
      sort: 'session_date',
      direction: 'desc',
      keyset: true,
      cursor: encodeCursor({ date: '2026-09-30', id: '00000000-0000-4000-8000-000000000003' }),
    })
    expect(attendance).toMatchObject({ hasMore: true, data: [{ sessionDate: '2026-09-29' }] })
    expect(attendance.nextCursor).toEqual(expect.any(String))

    setResults('audit_log', {
      data: [
        { id: 2, table_name: 'students', record_id: '1', action: 'insert', changed_at: '2026-09-29T10:00:00Z' },
        { id: 1, table_name: 'payments', record_id: '1', action: 'insert', changed_at: '2026-09-28T10:00:00Z' },
      ],
    })
    const audit = await listAuditPage({
      page: 1,
      pageSize: 1,
      search: '',
      direction: 'desc',
      keyset: true,
      cursor: encodeCursor({ at: '2026-09-30T00:00:00Z', id: 3 }),
    })
    expect(audit).toMatchObject({ hasMore: true, data: [{ tableName: 'students' }] })
    expect(audit.nextCursor).toEqual(expect.any(String))
  })

  it('delegates certificate listing with a safe sort and filter', async () => {
    mocks.listCertificates.mockResolvedValue({ data: [], totalCount: 0 })
    await expect(listCertificatePage(opts)).resolves.toEqual({ data: [], totalCount: 0 })
    expect(mocks.listCertificates).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sort: 'issue_date', direction: 'desc' }),
    )
  })

  it('requires an existing course and signs each material download URL', async () => {
    setResults('courses', { data: { name: 'Web' } })
    setResults('course_materials', {
      data: [
        {
          id: 'M1',
          course_id: 'C1',
          title: 'Slides',
          type: 'pdf',
          storage_path: 'C1/a.pdf',
          created_at: 'now',
          profiles: null,
          courses: null,
        },
      ],
    })
    await expect(listCourseMaterials('C1', 1, 10)).resolves.toMatchObject({
      courseName: 'Web',
      data: [{ signedUrl: 'https://signed.test/file', title: 'Slides' }],
    })
    setResults('courses', { data: null, error: null })
    await expect(listCourseMaterials('missing', 1, 10)).rejects.toBeInstanceOf(NotFoundError)
    setResults('courses', { data: { name: 'Web' } })
    setResults('course_materials', { data: [{ storage_path: 'x' }] })
    mocks.client.storageBucket.createSignedUrl.mockResolvedValueOnce({ data: null, error: new Error('sign failed') })
    await expect(listCourseMaterials('C1', 1, 10)).rejects.toThrow('sign failed')
  })
})
