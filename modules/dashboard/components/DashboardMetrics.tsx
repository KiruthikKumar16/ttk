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
import { TodayAttendanceSummary } from './TodayAttendanceSummary'
import { AttendanceWatchlistCard } from './AttendanceWatchlistCard'

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
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 sm:p-5 rounded-[22px] border border-[var(--g5)] shadow-[var(--shadow-xs)]"
          style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--g4)] border border-[var(--g5)] text-[var(--g1)] flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text-heading)]">
                  {pendingUsers.length} Access Request{pendingUsers.length > 1 ? 's' : ''} Pending
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--g4)] border border-[var(--g5)] text-[var(--g1)]">
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
            style={{ background: 'linear-gradient(135deg, var(--g1) 0%, var(--g1b) 100%)', textDecoration: 'none' }}
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
                className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors"
                style={{
                  background: activeView === 'staff' ? 'rgba(255,255,255,0.25)' : 'var(--g4)',
                  color: activeView === 'staff' ? '#fff' : 'var(--g1)',
                  borderColor: activeView === 'staff' ? 'rgba(255,255,255,0.3)' : 'var(--g5)',
                }}
              >
                {academicData.lowAttendanceStudents.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs px-3 flex items-center text-[var(--mute)] font-medium">
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

          <section className="panel mt-6 overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[var(--g5)]">
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
                  { header: 'Students', align: 'right', className: 'w-[15%]' },
                ]}
                rows={categoryMix.map((row) => ({
                  id: row.id,
                  cells: [
                    <div key="name" className="flex flex-col">
                      <span className="font-semibold text-[var(--text-heading)]">{row.name}</span>
                    </div>,
                    <div key="variants" className="flex flex-col">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--g4)] text-[var(--g1)] border border-[var(--g5)] w-fit"
                        title={row.courseNames?.join(', ')}
                      >
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
                    <span key="count" className="font-bold text-[var(--text-heading)] block text-right">
                      {row.studentCount}
                    </span>,
                  ],
                }))}
                emptyMessage="No category data available yet."
              />
            </div>
          </section>

          <section className="panel mt-6 overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[var(--g5)]">
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
                  { header: 'Amount', align: 'right', className: 'w-[20%]' },
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
                    <span key="amt" className="font-bold text-[var(--text-heading)] font-mono text-sm block text-right">
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
            <Link
              href="/attendance"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--text-heading)] shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, var(--g2b) 0%, var(--g1) 55%, var(--g1b) 100%)',
                }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -right-3 -bottom-3 h-12 w-12 rounded-full opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-25"
                style={{ background: 'var(--g3)' }}
                aria-hidden="true"
              />
              <CalendarDays size={14} className="relative z-10 text-[var(--g1)] transition-colors duration-200 group-hover:text-white" />
              <span className="relative z-10 transition-colors duration-200 group-hover:text-white">Mark / View Attendance</span>
            </Link>

            <Link
              href="/assessments"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--text-heading)] shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, var(--g2b) 0%, var(--g1) 55%, var(--g1b) 100%)',
                }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -right-3 -bottom-3 h-12 w-12 rounded-full opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-25"
                style={{ background: 'var(--g3)' }}
                aria-hidden="true"
              />
              <ClipboardCheck size={14} className="relative z-10 text-[var(--g1)] transition-colors duration-200 group-hover:text-white" />
              <span className="relative z-10 transition-colors duration-200 group-hover:text-white">
                Assessments ({academicData?.assessmentCount ?? 0})
              </span>
            </Link>

            <Link
              href="/materials"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--text-heading)] shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, var(--g2b) 0%, var(--g1) 55%, var(--g1b) 100%)',
                }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -right-3 -bottom-3 h-12 w-12 rounded-full opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-25"
                style={{ background: 'var(--g3)' }}
                aria-hidden="true"
              />
              <FolderOpen size={14} className="relative z-10 text-[var(--g1)] transition-colors duration-200 group-hover:text-white" />
              <span className="relative z-10 transition-colors duration-200 group-hover:text-white">
                Learning Materials ({academicData?.materialsCount ?? 0})
              </span>
            </Link>

            {canCreateStudent && (
              <Link
                href="/students/new"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--text-heading)] shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent cursor-pointer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background: 'linear-gradient(135deg, var(--g2b) 0%, var(--g1) 55%, var(--g1b) 100%)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -right-3 -bottom-3 h-12 w-12 rounded-full opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-25"
                  style={{ background: 'var(--g3)' }}
                  aria-hidden="true"
                />
                <Plus size={14} className="relative z-10 text-[var(--g1)] transition-colors duration-200 group-hover:text-white" />
                <span className="relative z-10 transition-colors duration-200 group-hover:text-white">Add Student</span>
              </Link>
            )}
          </div>

          {/* Attendance Summary & Watchlist */}
          {academicData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
              {/* Today's Attendance Summary with Donut Pattern Chart (Strictly Present & Absent) */}
              <TodayAttendanceSummary
                present={academicData.todayAttendance.present}
                absent={academicData.todayAttendance.absent}
                totalMarked={academicData.todayAttendance.totalMarked}
                rate={academicData.todayAttendance.rate}
                linkHref="/attendance"
                linkLabel="Attendance Registry"
              />

              {/* Low Attendance Watchlist Card */}
              <AttendanceWatchlistCard students={academicData.lowAttendanceStudents} />
            </div>
          )}

          {/* Recent Assessments Section */}
          {academicData && (
            <section className="panel mb-6 overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[var(--g5)]">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} style={{ color: 'var(--g1)' }} />
                  <h2>Recent Assessments</h2>
                </div>
                <Link href="/assessments" className="text-xs font-semibold text-[var(--g1)] hover:underline">
                  View assessments ({academicData.assessmentCount})
                </Link>
              </div>
              <div className="p-4 pt-1 overflow-hidden">
                <ModernTable
                  columns={[
                    { header: 'Assessment Title', align: 'left', className: 'w-[30%]' },
                    { header: 'Course', align: 'left', className: 'w-[26%]' },
                    { header: 'Date', align: 'left', className: 'w-[16%]' },
                    { header: 'Max Score', align: 'right', className: 'w-[14%]' },
                    { header: 'Action', align: 'right', className: 'w-[14%]' },
                  ]}
                  rows={academicData.recentAssessments.map((a) => ({
                    id: a.id,
                    cells: [
                      <span key="title" className="font-semibold text-[var(--text-heading)]">
                        {a.title}
                      </span>,
                      <span key="course" className="text-xs font-medium text-[var(--mute)]">
                        {a.courseName}
                      </span>,
                      <span key="date" className="text-xs text-[var(--mute)] font-medium">
                        {a.assessmentDate}
                      </span>,
                      <span key="score" className="font-bold text-[var(--text-heading)] block text-right">
                        {a.maxScore} marks
                      </span>,
                      <div key="act" className="flex items-center justify-end">
                        <Link
                          href={`/assessments`}
                          className="inline-flex items-center text-xs font-semibold text-[var(--g1)] hover:underline whitespace-nowrap"
                        >
                          Grade &rarr;
                        </Link>
                      </div>,
                    ],
                  }))}
                  emptyMessage="No assessments conducted yet."
                />
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
