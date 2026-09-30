import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), listPayments: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ rpc: mocks.rpc }) }))
vi.mock('@/lib/server-data', () => ({ listPayments: mocks.listPayments }))

import { getDashboardSummary, getDashboardSummaryForPeriod, getRecentPayments } from './service'

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
})
