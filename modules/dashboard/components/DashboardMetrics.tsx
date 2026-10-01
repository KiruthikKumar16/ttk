'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowRight,
  CircleDollarSign,
  Clock,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { money } from '@/lib/formatters'
import { paiseToRupees } from '@/lib/money'
import type { Course, CourseCategory, Payment, Student } from '@/lib/types'
import type { DashboardSummary } from '@/modules/dashboard/types'
import { CategoryBadge } from '@/components/CategoryBadge'
import { getTimeBasedGreeting } from '@/lib/greeting'

export function DashboardMetrics({
  summary,
  students = [],
  recentPayments = [],
  categories = [],
  courses = [],
  pendingUsers = [],
  canCreateStudent = false,
}: {
  summary: DashboardSummary
  students?: Student[]
  recentPayments?: Payment[]
  categories?: CourseCategory[]
  courses?: Course[]
  pendingUsers?: Array<{ id: string; fullName: string; createdAt?: string }>
  canCreateStudent?: boolean
}) {
  const router = useRouter()
  const [greetingData, setGreetingData] = useState(() => getTimeBasedGreeting())

  useEffect(() => {
    setGreetingData(getTimeBasedGreeting())
  }, [])

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

  const fallbackCategories = [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Essential', duration: '6 weeks' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Elite', duration: '12 weeks' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'Internship', duration: '3 Months' },
  ]
  const catList = (categories.length > 0 ? categories : fallbackCategories).map((c) => ({
    id: c.id,
    name: c.name,
    duration: c.duration,
  }))

  const courseToCatMap = new Map<string, { id: string; name: string }>()
  courses.forEach((c) => {
    const cat = catList.find((item) => item.id === c.categoryId)
    if (cat) {
      courseToCatMap.set(c.name.toLowerCase().trim(), { id: cat.id, name: cat.name })
    }
  })

  const categoryMix = catList.map((cat) => {
    const isInternship = cat.name.toLowerCase().includes('internship')
    const isElite = cat.name.toLowerCase().includes('elite')
    const catCourses = courses.filter((c) => {
      if (c.categoryId === cat.id) return true
      if (isInternship && c.name.toLowerCase().includes('internship')) return true
      if (!c.categoryId && isElite && (c.duration.includes('month') || c.duration.includes('12'))) return true
      return false
    })
    const catCourseNames = Array.from(new Set(catCourses.map((c) => c.name)))

    const count = students.filter((s) => {
      if (!s.course) return false
      const sCourse = s.course.trim().toLowerCase()
      if (catCourseNames.some((cn) => cn.trim().toLowerCase() === sCourse)) return true
      const mapped = courseToCatMap.get(sCourse)
      if (mapped && mapped.id === cat.id) return true
      if (isInternship && sCourse.includes('internship')) return true
      if (
        !mapped &&
        isElite &&
        (sCourse.includes('professional') || sCourse.includes('crash') || sCourse.includes('slash'))
      )
        return true
      return false
    }).length

    students.forEach((s) => {
      if (!s.course) return
      const sCourse = s.course.trim()
      const sCourseLower = sCourse.toLowerCase()
      if (isInternship && sCourseLower.includes('internship') && !catCourseNames.includes(sCourse)) {
        catCourseNames.push(sCourse)
      } else if (
        isElite &&
        (sCourseLower.includes('professional') || sCourseLower.includes('crash') || sCourseLower.includes('slash')) &&
        !catCourseNames.includes(sCourse)
      ) {
        catCourseNames.push(sCourse)
      }
    })

    return {
      id: cat.id,
      name: cat.name,
      duration: cat.duration,
      courseNames: catCourseNames,
      studentCount: count,
    }
  })

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{greetingData.formattedDate}</p>
          <h1>{greetingData.greeting}</h1>
          <p className="subcopy">{greetingData.subcopy}</p>
        </div>
        {canCreateStudent && (
          <Link href="/students/new" className="btn-primary">
            Add student
          </Link>
        )}
      </div>

      {pendingUsers.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {pendingUsers.length} Access Request{pendingUsers.length > 1 ? 's' : ''} Pending Approval
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                {pendingUsers
                  .map((u) => u.fullName)
                  .slice(0, 3)
                  .join(', ')}
                {pendingUsers.length > 3 ? ` and ${pendingUsers.length - 3} more` : ''} registered and waiting for
                academy portal access.
              </p>
            </div>
          </div>
          <Link
            href="/settings/users?filter=pending"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            Review & Approve Users <ArrowRight size={13} />
          </Link>
        </div>
      )}

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
        <div className="data-wrap" role="region" aria-label="Course mix" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th>Course Category</th>
                <th>Tier</th>
                <th>Duration</th>
                <th className="align-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {categoryMix.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="font-semibold text-slate-900 block">{row.name}</span>
                  </td>
                  <td>
                    <CategoryBadge categoryName={row.name} />
                  </td>
                  <td className="text-xs text-slate-600 font-medium">{row.duration}</td>
                  <td className="align-right font-bold text-slate-900">{row.studentCount}</td>
                </tr>
              ))}
              {categoryMix.length === 0 && (
                <tr>
                  <td colSpan={4}>No category data yet.</td>
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
        <div className="data-wrap" role="region" aria-label="Recent payments" tabIndex={0}>
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
                <tr
                  key={payment.id}
                  onClick={() => router.push(`/invoices/${encodeURIComponent(payment.invoice)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/invoices/${encodeURIComponent(payment.invoice)}`)
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors focus:outline-none focus:bg-slate-100"
                  title={`Open invoice ${payment.invoice}`}
                >
                  <td>
                    <Link
                      href={`/invoices/${encodeURIComponent(payment.invoice)}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {payment.invoice}
                    </Link>
                  </td>
                  <td>{payment.student}</td>
                  <td>{payment.date}</td>
                  <td className="align-right font-medium">{payment.amount.toLocaleString('en-IN')}</td>
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
