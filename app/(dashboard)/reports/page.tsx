import { requirePermission } from '@/lib/auth/current-profile'
import { getDashboardSummaryForPeriod } from '@/modules/dashboard/service'
import { ReportExport } from '@/modules/reports/components/ReportExport'
import { paiseToRupees } from '@/lib/money'
import { money } from '@/lib/formatters'

export default async function ReportsPage({ searchParams }: PageProps<'/reports'>) {
  await requirePermission('reports', 'read')
  const params = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`
  const requestedStart = Array.isArray(params.startDate) ? params.startDate[0] : params.startDate
  const requestedEnd = Array.isArray(params.endDate) ? params.endDate[0] : params.endDate
  const validDate = (value: string | undefined): value is string => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const timestamp = Date.parse(`${value}T00:00:00.000Z`)
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
  }
  let startDate = validDate(requestedStart) ? requestedStart : monthStart
  let endDate = validDate(requestedEnd) ? requestedEnd : today
  if (startDate > endDate) {
    startDate = monthStart
    endDate = today
  }
  const summary = await getDashboardSummaryForPeriod(startDate, endDate)
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ANALYTICS</p>
          <h1>Reports</h1>
          <p className="subcopy">Enrollment and payment totals are computed in the database for the selected period.</p>
        </div>
        <ReportExport startDate={startDate} endDate={endDate} />
      </div>
      <form action="/reports" className="panel mb-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Start date
          <input name="startDate" type="date" required defaultValue={startDate} className="input" />
        </label>
        <label className="grid gap-1 text-sm">
          End date
          <input name="endDate" type="date" required defaultValue={endDate} className="input" />
        </label>
        <button className="btn-primary min-h-10" type="submit">
          Apply date range
        </button>
      </form>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-head">Students enrolled in range</div>
          <div className="stat-value">{summary.studentCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">Payments received in range</div>
          <div className="stat-value">{money(paiseToRupees(summary.revenuePaise))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">Outstanding fees in cohort</div>
          <div className="stat-value">{money(paiseToRupees(summary.outstandingPaise))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">Eligible students in range</div>
          <div className="stat-value">{summary.eligibleCount}</div>
        </div>
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>Course mix</h2>
        </div>
        <div className="data-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Students</th>
              </tr>
            </thead>
            <tbody>
              {summary.courseMix.map((item) => (
                <tr key={item.course}>
                  <td>{item.course}</td>
                  <td>{item.studentCount}</td>
                </tr>
              ))}
              {summary.courseMix.length === 0 && (
                <tr>
                  <td colSpan={2}>No enrollments found for this date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
