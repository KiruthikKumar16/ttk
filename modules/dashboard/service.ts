import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { InternalError } from '@/lib/http/errors'
import type { DashboardSummary } from '@/modules/dashboard/types'
import { listPayments } from '@/lib/server-data'

function safeInteger(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new InternalError('Dashboard summary returned invalid totals.')
  return parsed
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_summary')
  if (error) throw new InternalError('Unable to load dashboard summary.')
  if (!data || typeof data !== 'object') throw new InternalError('Dashboard summary is unavailable.')
  const summary = data as Record<string, unknown>
  const courseMix = Array.isArray(summary.courseMix)
    ? summary.courseMix.map((entry) => {
        if (!entry || typeof entry !== 'object') throw new InternalError('Dashboard course mix is invalid.')
        const row = entry as Record<string, unknown>
        return { course: String(row.course), studentCount: safeInteger(row.studentCount) }
      })
    : []
  return {
    studentCount: safeInteger(summary.studentCount),
    revenuePaise: safeInteger(summary.revenuePaise),
    outstandingPaise: safeInteger(summary.outstandingPaise),
    eligibleCount: safeInteger(summary.eligibleCount),
    monthlyRevenuePaise: safeInteger(summary.monthlyRevenuePaise),
    courseMix,
  }
}

export async function getDashboardSummaryForPeriod(startDate: string, endDate: string): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_summary_for_period', {
    p_start_date: startDate,
    p_end_date: endDate,
  })
  if (error) throw new InternalError('Unable to load the date-range report.')
  if (!data || typeof data !== 'object') throw new InternalError('Date-range report is unavailable.')
  const summary = data as Record<string, unknown>
  const courseMix = Array.isArray(summary.courseMix)
    ? summary.courseMix.map((entry) => {
        if (!entry || typeof entry !== 'object') throw new InternalError('Report course mix is invalid.')
        const row = entry as Record<string, unknown>
        return { course: String(row.course), studentCount: safeInteger(row.studentCount) }
      })
    : []
  return {
    studentCount: safeInteger(summary.studentCount),
    revenuePaise: safeInteger(summary.revenuePaise),
    outstandingPaise: safeInteger(summary.outstandingPaise),
    eligibleCount: safeInteger(summary.eligibleCount),
    monthlyRevenuePaise: safeInteger(summary.monthlyRevenuePaise),
    courseMix,
  }
}

export async function getRecentPayments() {
  const supabase = await createClient()
  return listPayments(supabase, { page: 1, pageSize: 5 })
}
