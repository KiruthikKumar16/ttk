import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  listPayments: vi.fn(),
  from: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    from: mocks.from,
  }),
}))
vi.mock('@/lib/server-data', () => ({ listPayments: mocks.listPayments }))

import { getDashboardSummary, getDashboardSummaryForPeriod, getRecentPayments, getStaffDashboardData } from './service'

const summary = {
  studentCount: 12,
  revenuePaise: 540_000,
  outstandingPaise: 120_000,
  eligibleCount: 4,
  monthlyRevenuePaise: 75_000,
  courseMix: [{ course: 'Web Development', studentCount: 8 }],
}

describe('dashboard service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rpc.mockResolvedValue({ data: summary, error: null })
  })

  it('maps the dashboard summary and its course mix', async () => {
    await expect(getDashboardSummary()).resolves.toEqual(summary)
    expect(mocks.rpc).toHaveBeenCalledWith('get_dashboard_summary')
  })

  it('calls the date-range RPC with validated range values', async () => {
    await expect(getDashboardSummaryForPeriod('2026-04-01', '2027-03-31')).resolves.toEqual(summary)
    expect(mocks.rpc).toHaveBeenCalledWith('get_dashboard_summary_for_period', {
      p_start_date: '2026-04-01',
      p_end_date: '2027-03-31',
    })
  })

  it('rejects RPC errors, missing payloads, invalid totals and invalid course mixes', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('offline') })
    await expect(getDashboardSummary()).rejects.toThrow('Unable to load dashboard summary.')
    mocks.rpc.mockResolvedValueOnce({ data: null, error: null })
    await expect(getDashboardSummary()).rejects.toThrow('Dashboard summary is unavailable.')
    mocks.rpc.mockResolvedValueOnce({ data: { ...summary, revenuePaise: -1 }, error: null })
    await expect(getDashboardSummary()).rejects.toThrow('invalid totals')
    mocks.rpc.mockResolvedValueOnce({ data: { ...summary, courseMix: [null] }, error: null })
    await expect(getDashboardSummary()).rejects.toThrow('course mix is invalid')
  })

  it('uses an empty course mix for malformed optional values and delegates recent payments', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: { ...summary, courseMix: null }, error: null })
    await expect(getDashboardSummary()).resolves.toMatchObject({ courseMix: [] })
    mocks.listPayments.mockResolvedValue([{ id: 'p1' }])
    await expect(getRecentPayments()).resolves.toEqual([{ id: 'p1' }])
    expect(mocks.listPayments).toHaveBeenCalledWith(expect.anything(), { page: 1, pageSize: 5 })
  })

  it('aggregates staff academic dashboard metrics including attendance and assessments', async () => {
    mocks.from.mockImplementation((table: string) => {
      const query: any = {}
      for (const m of ['select', 'order', 'limit', 'eq']) {
        query[m] = vi.fn(() => query)
      }
      query.then = (resolve: (val: any) => any) => {
        if (table === 'students') {
          return resolve({
            data: [
              { id: '1', register_id: 101, name: 'Alice', course: 'Dev', status: 'Active', phone: '123' },
              { id: '2', register_id: 102, name: 'Bob', course: 'Dev', status: 'Active', phone: null },
            ],
            count: 2,
          })
        }
        if (table === 'attendance') {
          return resolve({
            data: [
              { id: 'a1', status: 'Present', course_id: 'c1', student_id: '1' },
              { id: 'a2', status: 'Absent', course_id: 'c1', student_id: '2' },
            ],
          })
        }
        if (table === 'assessments') {
          return resolve({
            data: [
              {
                id: 'as1',
                title: 'Test 1',
                course_id: 'c1',
                max_score: 50,
                assessment_date: '2026-09-29',
                courses: { name: 'Dev' },
              },
            ],
            count: 1,
          })
        }
        if (table === 'course_materials') {
          return resolve({ count: 5 })
        }
        return resolve({ data: [] })
      }
      return query
    })

    const staffData = await getStaffDashboardData()
    expect(staffData.totalStudents).toBe(2)
    expect(staffData.todayAttendance.totalMarked).toBe(2)
    expect(staffData.todayAttendance.present).toBe(1)
    expect(staffData.todayAttendance.absent).toBe(1)
    expect(staffData.todayAttendance.rate).toBe(50)
    expect(staffData.recentAssessments).toHaveLength(1)
    expect(staffData.materialsCount).toBe(5)
  })
})
