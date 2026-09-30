import Link from 'next/link'
import { ArrowDownRight, CircleDollarSign, ShieldCheck, Users } from 'lucide-react'
import { money } from '@/lib/formatters'
import { paiseToRupees } from '@/lib/money'
import type { Payment } from '@/lib/types'
import type { DashboardSummary } from '@/modules/dashboard/types'

export function DashboardMetrics({
  summary,
  recentPayments = [],
  canCreateStudent = false,
}: {
  summary: DashboardSummary
  recentPayments?: Payment[]
  canCreateStudent?: boolean
}) {
  const metrics = [
    { label: 'Total students', value: String(summary.studentCount), Icon: Users },
    { label: 'Revenue collected', value: money(paiseToRupees(summary.revenuePaise)), Icon: CircleDollarSign },
    { label: 'Outstanding balance', value: money(paiseToRupees(summary.outstandingPaise)), Icon: ArrowDownRight },
    { label: 'Certificate eligible', value: String(summary.eligibleCount), Icon: ShieldCheck },
    { label: 'Revenue this month', value: money(paiseToRupees(summary.monthlyRevenuePaise)), Icon: CircleDollarSign },
  ]
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DASHBOARD</p>
          <h1>Good morning</h1>
          <p className="subcopy">Here&rsquo;s what&rsquo;s happening across ThoorigAI Infotech.</p>
        </div>
        {canCreateStudent && (
          <Link href="/students/new" className="btn-primary">
            Add student
          </Link>
        )}
      </div>
      <div className="stats-grid">
        {metrics.map(({ label, value, Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-head">
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>Course mix</h2>
          <Link href="/courses">View courses</Link>
        </div>
        <div className="data-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th className="align-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {summary.courseMix.map((row) => (
                <tr key={row.course}>
                  <td>{row.course}</td>
                  <td className="align-right">{row.studentCount}</td>
                </tr>
              ))}
              {summary.courseMix.length === 0 && (
                <tr>
                  <td colSpan={2}>No enrollment data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Recent payments</h2>
          <Link href="/payments">View all</Link>
        </div>
        <div className="data-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Student</th>
                <th>Date</th>
                <th className="align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <Link href={`/invoices/${encodeURIComponent(payment.invoice)}`}>{payment.invoice}</Link>
                  </td>
                  <td>{payment.student}</td>
                  <td>{payment.date}</td>
                  <td className="align-right">{payment.amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={4}>No payments recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
