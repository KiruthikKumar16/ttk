'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  FolderOpen,
  GraduationCap,
  Phone,
  Plus,
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
import type { StaffDashboardData } from '@/modules/dashboard/service'
import { CategoryBadge } from '@/components/CategoryBadge'
import { getTimeBasedGreeting } from '@/lib/greeting'

export function DashboardMetrics({
  summary,
  students = [],
  recentPayments = [],
  categories = [],
  courses = [],
  pendingUsers = [],
  academicData = null,
  canCreateStudent = false,
}: {
  summary: DashboardSummary
  students?: Student[]
  recentPayments?: Payment[]
  categories?: CourseCategory[]
  courses?: Course[]
  pendingUsers?: Array<{ id: string; fullName: string; createdAt?: string }>
  academicData?: StaffDashboardData | null
  canCreateStudent?: boolean
}) {
  const router = useRouter()
  const [greetingData, setGreetingData] = useState(() => getTimeBasedGreeting())
  const [activeView, setActiveView] = useState<'financial' | 'staff'>('financial')

  useEffect(() => {
    setGreetingData(getTimeBasedGreeting())
    try {
      const saved = localStorage.getItem('admin_dashboard_active_view')
      if (saved === 'financial' || saved === 'staff') {
        setActiveView(saved)
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }, [])

  const handleViewChange = (view: 'financial' | 'staff') => {
    setActiveView(view)
    try {
      localStorage.setItem('admin_dashboard_active_view', view)
    } catch {
      // Storage access blocked or unavailable
    }
  }

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

  const financialMetrics = [
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

  const staffMetrics = [
    {
      label: 'Enrolled students',
      value: String(academicData?.totalStudents ?? studentCount),
      sub: 'Active registered learners',
      Icon: Users,
      iconClass: 'icon-blue',
    },
    {
      label: 'Present today',
      value: String(academicData?.todayAttendance?.present ?? 0),
      sub: `${academicData?.todayAttendance?.totalMarked ?? 0} students marked today`,
      Icon: UserCheck,
      iconClass: 'icon-green',
    },
    {
      label: 'Today attendance rate',
      value: `${academicData?.todayAttendance?.rate ?? 0}%`,
      sub: 'Classroom attendance health',
      Icon: CheckCircle2,
      iconClass: 'icon-navy',
    },
    {
      label: 'Attendance watchlist',
      value: String(academicData?.lowAttendanceStudents?.length ?? 0),
      sub: 'Students below 75% threshold',
      Icon: AlertTriangle,
      iconClass: 'icon-amber',
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
          <Link href="/students/new" className="btn-primary" style={{ gap: 6 }}>
            <Plus size={14} />
            Add student
          </Link>
        )}
      </div>

      {pendingUsers.length > 0 && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.9), rgba(254, 243, 199, 0.6))',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'grid',
                placeItems: 'center',
                color: '#b45309',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: '#78350f' }}>
                  {pendingUsers.length} Access Request{pendingUsers.length > 1 ? 's' : ''} Pending
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#92400e',
                  }}
                >
                  Action Required
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
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
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold shrink-0 transition-all shadow-xs"
            style={{ background: 'linear-gradient(135deg, #b45309, #92400e)' }}
          >
            Review & Approve <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Admin View Switcher Toggle */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
        style={{
          padding: '6px 6px 6px 8px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          role="tablist"
          aria-label="Dashboard view toggle"
          className="inline-flex items-center p-1 rounded-lg"
          style={{ background: 'rgba(241, 245, 249, 0.6)' }}
        >
          <button
            type="button"
            role="tab"
            id="admin-dashboard-toggle-financial"
            aria-selected={activeView === 'financial'}
            aria-controls="admin-financial-panel"
            onClick={() => handleViewChange('financial')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
            style={{
              background:
                activeView === 'financial' ? 'linear-gradient(135deg, var(--gold), var(--gold-deep))' : 'transparent',
              color: activeView === 'financial' ? '#fff' : '#64748b',
              boxShadow: activeView === 'financial' ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none',
            }}
          >
            <CircleDollarSign size={13} />
            <span>Financial Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            id="admin-dashboard-toggle-staff"
            aria-selected={activeView === 'staff'}
            aria-controls="admin-staff-panel"
            onClick={() => handleViewChange('staff')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
            style={{
              background:
                activeView === 'staff' ? 'linear-gradient(135deg, var(--gold), var(--gold-deep))' : 'transparent',
              color: activeView === 'staff' ? '#fff' : '#64748b',
              boxShadow: activeView === 'staff' ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none',
            }}
          >
            <GraduationCap size={13} />
            <span>Staff & Academic Data</span>
            {academicData && academicData.lowAttendanceStudents.length > 0 && (
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: activeView === 'staff' ? 'rgba(255,255,255,0.2)' : 'rgba(245, 158, 11, 0.12)',
                  color: activeView === 'staff' ? '#fff' : '#92400e',
                }}
              >
                {academicData.lowAttendanceStudents.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs px-2 flex items-center gap-2" style={{ color: '#64748b' }}>
          <span className="shrink-0" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span>
            {activeView === 'financial'
              ? 'Displaying tuition revenue, fee balances & payments'
              : 'Displaying classroom sessions, attendance & assessments'}
          </span>
        </div>
      </div>

      {/* ─── FINANCIAL VIEW PANEL ─── */}
      {activeView === 'financial' && (
        <div id="admin-financial-panel" role="tabpanel" aria-labelledby="admin-dashboard-toggle-financial">
          <div className="reports-stats-grid">
            {financialMetrics.map(({ label, value, sub, Icon, iconClass }) => (
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

          <section className="panel mt-6">
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

          <section className="panel mt-6">
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
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      title={`Open invoice ${payment.invoice}`}
                    >
                      <td>
                        <Link
                          href={`/invoices/${encodeURIComponent(payment.invoice)}`}
                          className="inline-flex items-center min-h-[28px] font-medium text-indigo-600 hover:text-indigo-800"
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
        </div>
      )}

      {/* ─── STAFF & ACADEMIC VIEW PANEL ─── */}
      {activeView === 'staff' && (
        <div id="admin-staff-panel" role="tabpanel" aria-labelledby="admin-dashboard-toggle-staff">
          {/* Top Academic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {staffMetrics.map(({ label, value, sub, Icon, iconClass }) => (
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

          {/* Quick Academic Actions Dock */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
              }}
            >
              <CalendarDays size={13} />
              Mark / View Attendance
            </Link>
            <Link
              href="/assessments"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                border: '1px solid rgba(226, 232, 240, 0.6)',
                background: 'rgba(255, 255, 255, 0.7)',
                color: '#334155',
              }}
            >
              <ClipboardCheck size={13} style={{ color: 'var(--gold)' }} />
              Assessments ({academicData?.assessmentCount ?? 0})
            </Link>
            <Link
              href="/materials"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                border: '1px solid rgba(226, 232, 240, 0.6)',
                background: 'rgba(255, 255, 255, 0.7)',
                color: '#334155',
              }}
            >
              <FolderOpen size={13} style={{ color: '#d97706' }} />
              Learning Materials ({academicData?.materialsCount ?? 0})
            </Link>
            {canCreateStudent && (
              <Link
                href="/students/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: '#334155',
                }}
              >
                <Plus size={13} style={{ color: '#10b981' }} />
                Add Student
              </Link>
            )}
          </div>

          {/* Attendance Summary & Watchlist */}
          {academicData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
              {/* Today's Attendance Progress Box */}
              <div className="panel p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Attendance Summary</h2>
                    </div>
                    <Link
                      href="/attendance"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Attendance Registry <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      className="p-3.5 rounded-xl border"
                      style={{
                        background: 'rgba(236, 253, 245, 0.6)',
                        borderColor: 'rgba(167, 243, 208, 0.6)',
                      }}
                    >
                      <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                        Present / Late
                      </p>
                      <p className="text-2xl font-bold text-emerald-900 mt-1">{academicData.todayAttendance.present}</p>
                      <p className="text-[10px] text-emerald-700 mt-0.5">Students in session</p>
                    </div>

                    <div
                      className="p-3.5 rounded-xl border"
                      style={{
                        background: 'rgba(255, 241, 242, 0.6)',
                        borderColor: 'rgba(254, 205, 211, 0.6)',
                      }}
                    >
                      <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Absent</p>
                      <p className="text-2xl font-bold text-rose-900 mt-1">{academicData.todayAttendance.absent}</p>
                      <p className="text-[10px] text-rose-700 mt-0.5">Marked absent today</p>
                    </div>

                    <div
                      className="p-3.5 rounded-xl border"
                      style={{
                        background: 'rgba(248, 250, 252, 0.8)',
                        borderColor: 'rgba(226, 232, 240, 0.8)',
                      }}
                    >
                      <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Total Marked</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {academicData.todayAttendance.totalMarked}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Records logged today</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Progress Bar */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                    <span>Classroom Attendance Health</span>
                    <span className="font-bold text-slate-900">{academicData.todayAttendance.rate}% Present</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, academicData.todayAttendance.rate))}%`,
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Low Attendance Watchlist Card */}
              <div
                className="p-5 rounded-2xl flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.25), rgba(255, 255, 255, 0.85))',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  boxShadow: 'var(--shadow-sm)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span>Attendance Watchlist (&lt; 75%)</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#92400e',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      {academicData.lowAttendanceStudents.length} Students
                    </span>
                  </div>

                  <p className="text-xs text-amber-800/90 mt-2 mb-3">
                    Learners below 75% attendance criteria requiring academy follow-up.
                  </p>
                </div>

                {academicData.lowAttendanceStudents.length === 0 ? (
                  <div className="py-7 px-4 text-center text-xs text-emerald-800 bg-white/70 rounded-xl border border-emerald-100 flex-1 flex flex-col items-center justify-center">
                    <CheckCircle2 size={22} className="mx-auto mb-1.5 text-emerald-600" />
                    <span className="font-medium">All active students meet the 75% attendance threshold!</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {academicData.lowAttendanceStudents.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/students/${s.registerId}`}
                              className="text-xs font-semibold text-slate-900 hover:text-indigo-600 truncate"
                            >
                              {s.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono">#{s.registerId}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{s.course}</p>
                          {s.phone && (
                            <a
                              href={`tel:${s.phone}`}
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-medium mt-1 hover:underline"
                            >
                              <Phone size={10} />
                              {s.phone}
                            </a>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/50">
                            {s.rate}%
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {s.presentSessions}/{s.totalSessions} days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Assessments Section */}
          {academicData && (
            <section className="panel mb-6">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-indigo-600" />
                  <h2>Recent Assessments</h2>
                </div>
                <Link href="/assessments">View assessments ({academicData.assessmentCount})</Link>
              </div>
              <div className="data-wrap" role="region" aria-label="Recent assessments" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th>Assessment Title</th>
                      <th>Course</th>
                      <th>Date</th>
                      <th className="align-right">Max Score</th>
                      <th className="align-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicData.recentAssessments.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <span className="font-semibold text-slate-900 block">{a.title}</span>
                        </td>
                        <td>
                          <span className="text-xs font-medium text-slate-700">{a.courseName}</span>
                        </td>
                        <td className="text-xs text-slate-600">{a.assessmentDate}</td>
                        <td className="align-right font-bold text-slate-900">{a.maxScore} marks</td>
                        <td className="align-right">
                          <Link
                            href={`/assessments`}
                            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Grade / Review &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {academicData.recentAssessments.length === 0 && (
                      <tr>
                        <td colSpan={5}>No assessments conducted yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!academicData && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <p className="text-sm">No academic data available yet.</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
