import { z } from 'zod'
import { withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { getDashboardSummaryForPeriod } from '@/modules/dashboard/service'
import { paiseToRupees } from '@/lib/money'
import { money } from '@/lib/formatters'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Enter a valid calendar date.')
const querySchema = z
  .object({ startDate: date, endDate: date })
  .refine(({ startDate, endDate }) => startDate <= endDate, {
    message: 'Start date must be on or before end date.',
    path: ['startDate'],
  })

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export const GET = withApi({ roles: rolesFor('reports', 'export'), query: querySchema }, async ({ query }) => {
  const summary = await getDashboardSummaryForPeriod(query.startDate, query.endDate)
  const rows: (string | number)[][] = [
    ['Report', 'Value'],
    ['Start date', query.startDate],
    ['End date', query.endDate],
    ['Students enrolled in range', summary.studentCount],
    ['Payments received in range', money(paiseToRupees(summary.revenuePaise))],
    ['Outstanding fees for students enrolled in range', money(paiseToRupees(summary.outstandingPaise))],
    ['Eligible students enrolled in range', summary.eligibleCount],
    ...summary.courseMix.map((item) => [`Course: ${item.course}`, item.studentCount]),
  ]
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const row of rows) controller.enqueue(encoder.encode(`${row.map(csvCell).join(',')}\r\n`))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="thoorigai-report-${query.startDate}-to-${query.endDate}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
})
