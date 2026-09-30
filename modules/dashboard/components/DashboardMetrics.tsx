import Link from 'next/link'
import {
  ArrowDownRight,
  CircleDollarSign,
  Clock,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { money } from '@/lib/formatters'
import { paiseToRupees } from '@/lib/money'
import type { Course, CourseCategory, Payment, Student } from '@/lib/types'
import type { DashboardSummary } from '@/modules/dashboard/types'
import { CategoryBadge, getCategoryBadgeStyle } from '@/components/CategoryBadge'

export function DashboardMetrics({
  summary,
  students = [],
  recentPayments = [],
  categories = [],
  courses = [],
  canCreateStudent = false,
}: {
  summary: DashboardSummary
  students?: Student[]
  recentPayments?: Payment[]
  categories?: CourseCategory[]
  courses?: Course[]
  canCreateStudent?: boolean
}) {
  const revenue = paiseToRupees(summary.revenuePaise)
  const outstanding = paiseToRupees(summary.outstandingPaise)
  const totalFees = students.length > 0 ? students.reduce((s, x) => s + x.total, 0) : revenue + outstanding
  const studentCount = summary.studentCount || students.length
  const eligibleCount = summary.eligibleCount
  const pendingCount =
    students.length > 0
      ? students.filter((s) => s.status === 'Pending').length
      : Math.max(0, studentCount - eligibleCount)
  const collectionRate = totalFees > 0 ? Math.round((revenue / totalFees) * 100) : 0
  const avgFee = studentCount > 0 ? Math.round(totalFees / studentCount) : 0

  const todayStr = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  const metrics = [
    // Row 1: Financial Performance
    {
      label: 'Revenue collected',
      value: money(revenue),
      sub: 'Total collected to date',
      Icon: CircleDollarSign,
      iconClass: 'icon-green',
    },
    {
      label: 'Total course fees',
      value: money(totalFees),
      sub: 'Enrolled cohort value',
      Icon: Wallet,
      iconClass: 'icon-navy',
    },
    {
      label: 'Outstanding balance',
      value: money(outstanding),
      sub: 'Pending collection',
      Icon: ArrowDownRight,
      iconClass: 'icon-amber',
    },
    {
      label: 'Collection efficiency',
      value: `${collectionRate}%`,
      sub: `${money(revenue)} of ${money(totalFees)}`,
      Icon: TrendingUp,
      iconClass: 'icon-blue',
    },

    // Row 2: Operational Health & Demographics
    {
      label: 'Total students',
      value: String(studentCount),
      sub: 'Active enrollments',
      Icon: Users,
      iconClass: 'icon-blue',
    },
    {
      label: 'Certificate eligible',
      value: String(eligibleCount),
      sub: '100% fees cleared',
      Icon: ShieldCheck,
      iconClass: 'icon-green',
    },
    {
      label: 'Pending dues',
      value: String(pendingCount),
      sub: 'Students with balance',
      Icon: Clock,
      iconClass: 'icon-amber',
    },
    {
      label: 'Average course fee',
      value: money(avgFee),
      sub: 'Per enrolled student',
      Icon: GraduationCap,
      iconClass: 'icon-navy',
    },
  ]

  const courseToCategoryMap = new Map<string, { categoryName?: string; duration?: string }>()
  courses.forEach((c) => {
    courseToCategoryMap.set(c.name.toLowerCase().trim(), {
      categoryName: c.categoryName ?? undefined,
      duration: c.duration,
    })
  })

  const tierPills = categories.map((cat) => {
    const matchingCourseNames = courses
      .filter((c) => c.categoryId === cat.id)
      .map((c) => c.name.toLowerCase().trim())
    const count = students.filter(
      (s) => s.course && matchingCourseNames.includes(s.course.toLowerCase().trim())
    ).length
    return {
      ...cat,
      studentCount: count,
    }
  })

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{todayStr}</p>
          <h1>Good morning</h1>
          <p className="subcopy">Here&rsquo;s what&rsquo;s happening across ThoorigAI Infotech.</p>
          {tierPills.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                Curriculum Tiers:
              </span>
              {tierPills.map((tier) => (
                <Link
                  key={tier.id}
                  href={`/students?categoryId=${encodeURIComponent(tier.id)}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors shadow-xs ${
                    getCategoryBadgeStyle(tier.name).pill
                  }`}
                >
                  <span className="font-semibold">{tier.name}</span>
                  <span className="text-[11px] opacity-75">({tier.duration})</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/80 font-bold text-[10px] ml-0.5">
                    {tier.studentCount}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        {canCreateStudent && (
          <Link href="/students/new" className="btn-primary">
            Add student
          </Link>
        )}
      </div>
      <div className="reports-stats-grid">
        {metrics.map(({ label, value, sub, Icon, iconClass }) => (
          <div className="stat-card" key={label}>
            <div className="stat-head">
              <span>{label}</span>
              <div className={`stat-icon ${iconClass}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="stat-value">{value}</div>
            <p className="stat-sub">{sub}</p>
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
                <th>Tier</th>
                <th>Duration</th>
                <th className="align-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {summary.courseMix.map((row) => {
                const info = courseToCategoryMap.get(row.course.toLowerCase().trim())
                return (
                  <tr key={row.course}>
                    <td className="font-medium text-slate-900">{row.course}</td>
                    <td>
                      {info?.categoryName ? (
                        <CategoryBadge categoryName={info.categoryName} />
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">{info?.duration || '—'}</td>
                    <td className="align-right font-medium">{row.studentCount}</td>
                  </tr>
                )
              })}
              {summary.courseMix.length === 0 && (
                <tr>
                  <td colSpan={4}>No enrollment data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Recent payments</h2>
          <Link href="/invoices">View all</Link>
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
