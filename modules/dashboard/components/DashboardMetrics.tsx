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
import { KpiCard } from '@/components/ui/KpiCard'
import { PillButton } from '@/components/ui/PillButton'
import { ModernTable } from '@/components/ui/ModernTable'

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

    const variantsCount =
      catCourseNames.length > 0
        ? catCourseNames.length
        : courses.filter((c) => c.categoryId === cat.id).length || 1

    return {
      id: cat.id,
      name: cat.name,
      duration: cat.duration,
      courseNames: isInternship
        ? catCourseNames.map((n) => n.replace(/course\s*[-–]\s*/gi, '').replace(/\bcourse\b/gi, 'Track').trim())
        : catCourseNames,
      variantsCount,
      studentCount: count,
      isInternship,
    }
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
            {greetingData.formattedDate}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-heading)]">
            {greetingData.greeting}
          </h1>
          <p className="text-sm text-[var(--mute)] mt-1">{greetingData.subcopy}</p>
        </div>
        {canCreateStudent && (
          <Link href="/students/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} />
            <span>Add student</span>
          </Link>
        )}
      </div>

      {pendingUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 sm:p-5 rounded-[22px] border border-amber-200/60 bg-[var(--warning-bg)] shadow-[var(--shadow-xs)]">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/15 text-[#854d0e] flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text-heading)]">
                  {pendingUsers.length} Access Request{pendingUsers.length > 1 ? 's' : ''} Pending
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-[#854d0e]">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-[var(--mute)] mt-0.5">
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white text-xs font-semibold shrink-0 shadow-sm transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #b45309, #92400e)', textDecoration: 'none' }}
          >
            Review & Approve <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Admin View Switcher Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 p-2 rounded-[22px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
        <div
          role="tablist"
          aria-label="Dashboard view toggle"
          className="inline-flex items-center p-1 rounded-full bg-[var(--panel)]"
        >
          <button
            type="button"
            role="tab"
            id="admin-dashboard-toggle-financial"
            aria-selected={activeView === 'financial'}
            aria-controls="admin-financial-panel"
            onClick={() => handleViewChange('financial')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeView === 'financial' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={{
              background: activeView === 'financial' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
            }}
          >
            <CircleDollarSign size={14} />
            <span>Financial Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            id="admin-dashboard-toggle-staff"
            aria-selected={activeView === 'staff'}
            aria-controls="admin-staff-panel"
            onClick={() => handleViewChange('staff')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeView === 'staff' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={{
              background: activeView === 'staff' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
            }}
          >
            <GraduationCap size={14} />
            <span>Staff & Academic Data</span>
            {academicData && academicData.lowAttendanceStudents.length > 0 && (
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: activeView === 'staff' ? 'rgba(255,255,255,0.25)' : 'var(--warning-bg)',
                  color: activeView === 'staff' ? '#fff' : '#854d0e',
                }}
              >
                {academicData.lowAttendanceStudents.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs px-3 flex items-center gap-2 text-[var(--mute)] font-medium">
          <span className="shrink-0 h-2 w-2 rounded-full" style={{ background: 'var(--g1)' }} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {financialMetrics.map(({ label, value, sub, Icon }) => (
              <KpiCard
                key={label}
                title={label}
                value={value}
                subtitle={sub}
                icon={<Icon size={18} />}
              />
            ))}
          </div>

          <section className="panel mt-6 overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_var(--g1b)] hover:border-transparent">
            <div className="panel-header">
              <div>
                <h2>Course mix</h2>
                <p className="text-xs text-[var(--mute)] mt-0.5">Program categories, course variants, and enrolled student breakdown</p>
              </div>
              <Link href="/courses" className="text-xs font-semibold text-[var(--g1)] hover:underline">
                View courses
              </Link>
            </div>
            <div className="p-4 pt-1 overflow-hidden">
              <ModernTable
                columns={[
                  { header: 'Course Category', align: 'left', className: 'w-[28%]' },
                  { header: 'Variants', align: 'left', className: 'w-[42%]' },
                  { header: 'Duration', align: 'left', className: 'w-[15%]' },
                  { header: 'Students', align: 'center', className: 'w-[15%]' },
                ]}
                rows={categoryMix.map((row) => ({
                  id: row.id,
                  cells: [
                    <div key="name" className="flex flex-col">
                      <span className="font-semibold text-[var(--text-heading)]">{row.name}</span>
                    </div>,
                    <div key="variants" className="flex flex-col">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--g4)] text-[var(--g1)] border border-[var(--g5)] w-fit"
                        title={row.courseNames?.join(', ')}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--g1)]" />
                        <span>
                          {row.isInternship
                            ? 'Type: Internship'
                            : `${row.variantsCount} ${row.variantsCount === 1 ? 'Course' : 'Courses'}`}
                        </span>
                      </span>
                      {row.courseNames && row.courseNames.length > 0 && (
                        <span className="text-[11px] text-[var(--mute)] truncate max-w-xs mt-1" title={row.courseNames.join(', ')}>
                          {row.isInternship
                            ? (row.courseNames[0] || 'Industry Internship Track')
                            : `${row.courseNames.slice(0, 2).join(', ')}${row.courseNames.length > 2 ? ` +${row.courseNames.length - 2} more` : ''}`}
                        </span>
                      )}
                    </div>,
                    <span key="dur" className="text-xs text-[var(--mute)] font-medium">
                      {row.duration}
                    </span>,
                    <span key="count" className="font-bold text-[var(--text-heading)] block text-center">
                      {row.studentCount}
                    </span>,
                  ],
                }))}
                emptyMessage="No category data available yet."
              />
            </div>
          </section>

          <section className="panel mt-6 overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_var(--g1b)] hover:border-transparent">
            <div className="panel-header">
              <div>
                <h2>Recent payments</h2>
                <p className="text-xs text-[var(--mute)] mt-0.5">Latest receipts, invoiced learners, and collected fee amounts</p>
              </div>
              <Link href="/invoices" className="text-xs font-semibold text-[var(--g1)] hover:underline">
                View all
              </Link>
            </div>
            <div className="p-4 pt-1 overflow-hidden">
              <ModernTable
                columns={[
                  { header: 'Invoice', align: 'left', className: 'w-[25%]' },
                  { header: 'Student', align: 'left', className: 'w-[35%]' },
                  { header: 'Date', align: 'left', className: 'w-[20%]' },
                  { header: 'Amount', align: 'center', className: 'w-[20%]' },
                ]}
                rows={recentPayments.map((payment) => ({
                  id: payment.id,
                  onClick: () => router.push(`/invoices/${encodeURIComponent(payment.invoice)}`),
                  title: `Open invoice ${payment.invoice}`,
                  cells: [
                    <span key="inv" className="font-semibold text-[var(--g1)] hover:underline font-mono text-xs">
                      {payment.invoice}
                    </span>,
                    <span key="stu" className="font-medium text-[var(--text-heading)]">
                      {payment.student}
                    </span>,
                    <span key="date" className="text-xs text-[var(--mute)] font-medium">
                      {payment.date}
                    </span>,
                    <span key="amt" className="font-bold text-[var(--text-heading)] font-mono text-sm block text-center">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </span>,
                  ],
                }))}
                emptyMessage="No payments recorded yet."
              />
            </div>
          </section>
        </div>
      )}

      {/* ─── STAFF & ACADEMIC VIEW PANEL ─── */}
      {activeView === 'staff' && (
        <div id="admin-staff-panel" role="tabpanel" aria-labelledby="admin-dashboard-toggle-staff">
          {/* Top Academic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {staffMetrics.map(({ label, value, sub, Icon }) => (
              <KpiCard
                key={label}
                title={label}
                value={value}
                subtitle={sub}
                icon={<Icon size={18} />}
              />
            ))}
          </div>

          {/* Quick Academic Actions Dock */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <Link href="/attendance" className="btn-primary" style={{ textDecoration: 'none' }}>
              <CalendarDays size={14} />
              <span>Mark / View Attendance</span>
            </Link>
            <Link href="/assessments" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <ClipboardCheck size={14} style={{ color: 'var(--g1)' }} />
              <span>Assessments ({academicData?.assessmentCount ?? 0})</span>
            </Link>
            <Link href="/materials" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <FolderOpen size={14} style={{ color: 'var(--g1)' }} />
              <span>Learning Materials ({academicData?.materialsCount ?? 0})</span>
            </Link>
            {canCreateStudent && (
              <Link href="/students/new" className="btn-secondary" style={{ textDecoration: 'none' }}>
                <Plus size={14} style={{ color: '#1b7a4b' }} />
                <span>Add Student</span>
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
