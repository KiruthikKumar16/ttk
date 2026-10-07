'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Search,
  Download,
  Filter,
  BarChart3,
  CalendarDays,
  FileText,
  AlertTriangle,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Building,
  CalendarCheck,
  Sparkles,
} from 'lucide-react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { AttendanceMarking } from './AttendanceMarking'
import { KpiCard } from '@/components/ui/KpiCard'
import type { CourseCategory } from '@/lib/types'

export interface CourseOption {
  id: string
  name: string
  categoryId?: string | null
  categoryName?: string | null
  duration?: string | null
}

export interface CourseSummaryRow {
  course_id: string
  course_name: string
  students: number
  sessions: number
  present_sessions: number
  attendance_percent: number
}

export interface StudentSummaryRow {
  course_id: string
  course_name: string
  register_id: number
  student_name: string
  sessions: number
  present_sessions: number
  attendance_percent: number
}

interface AttendanceClientViewProps {
  courses: CourseOption[]
  categories: CourseCategory[]
  selectedCourseId?: string
  selectedDate: string
  roster: { registerId: number; name: string; status: string | null }[]
  courseReports: CourseSummaryRow[]
  studentReports: StudentSummaryRow[]
  courseCategoryMap: Record<string, string | null | undefined>
  recordsSection: React.ReactNode
}

export function AttendanceClientView({
  courses,
  categories,
  selectedCourseId,
  selectedDate,
  roster,
  courseReports,
  studentReports,
  courseCategoryMap,
  recordsSection,
}: AttendanceClientViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Active view tab state (persisted or from query)
  const defaultTab =
    searchParams.get('tab') === 'analytics'
      ? 'analytics'
      : searchParams.get('tab') === 'records'
        ? 'records'
        : 'marking'
  const [activeTab, setActiveTab] = useState<'marking' | 'analytics' | 'records'>(defaultTab)

  const [dateInput, setDateInput] = useState(selectedDate)
  const [courseInput, setCourseInput] = useState(selectedCourseId || '')

  // Top KPIs computation
  const kpiData = useMemo(() => {
    let totalRecordedSessions = 0
    let totalPresentSessions = 0
    let totalStudents = 0
    let atRiskCoursesCount = 0

    for (const c of courseReports) {
      totalRecordedSessions += Number(c.sessions || 0)
      totalPresentSessions += Number(c.present_sessions || 0)
      totalStudents += Number(c.students || 0)
      if (Number(c.attendance_percent || 0) < 75) {
        atRiskCoursesCount += 1
      }
    }

    const overallPct = totalRecordedSessions > 0 ? (totalPresentSessions / totalRecordedSessions) * 100 : 0

    return {
      overallPct: Number(overallPct.toFixed(1)),
      totalStudents,
      totalSessions: totalRecordedSessions,
      atRiskCount: atRiskCoursesCount,
      activeCoursesCount: courseReports.length,
    }
  }, [courseReports])

  const selectedCourseObj = useMemo(() => {
    return courses.find((c) => c.id === (courseInput || selectedCourseId))
  }, [courses, courseInput, selectedCourseId])

  const formattedDateLabel = useMemo(() => {
    try {
      const parts = (dateInput || selectedDate).split('-').map(Number)
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const d = new Date(parts[0], parts[1] - 1, parts[2])
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
    } catch {}
    return dateInput || selectedDate
  }, [dateInput, selectedDate])

  const isTodaySelected = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return (dateInput || selectedDate) === today
  }, [dateInput, selectedDate])

  // Quick date change handlers (timezone-safe)
  const handleDateShift = (deltaDays: number) => {
    try {
      const parts = (dateInput || new Date().toISOString().slice(0, 10)).split('-').map(Number)
      const current = new Date(parts[0], parts[1] - 1, parts[2] + deltaDays)
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      const d = String(current.getDate()).padStart(2, '0')
      const nextDate = `${y}-${m}-${d}`
      setDateInput(nextDate)
      navigateWithParams(courseInput, nextDate)
    } catch {
      // Fallback
    }
  }

  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    setDateInput(today)
    navigateWithParams(courseInput, today)
  }

  const navigateWithParams = (cId: string, d: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cId) params.set('courseId', cId)
    else params.delete('courseId')

    if (d) params.set('date', d)
    else params.delete('date')

    params.set('tab', activeTab)

    startTransition(() => {
      router.push(`/attendance?${params.toString()}`)
    })
  }

  const handleTabChange = (tab: 'marking' | 'analytics' | 'records') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/attendance?${params.toString()}`, { scroll: false })
  }

  // Export Course Summary to CSV
  const handleExportCourseSummaryCSV = () => {
    if (!courseReports || courseReports.length === 0) return
    const headers = [
      'Course Name',
      'Category',
      'Students',
      'Recorded Sessions',
      'Present Sessions',
      'Attendance Rate (%)',
    ]
    const csvRows = [headers.join(',')]

    for (const r of courseReports) {
      const category = courseCategoryMap[r.course_id] || 'Unassigned'
      const row = [
        `"${r.course_name.replace(/"/g, '""')}"`,
        `"${category.replace(/"/g, '""')}"`,
        r.students,
        r.sessions,
        r.present_sessions,
        Number(r.attendance_percent).toFixed(1),
      ]
      csvRows.push(row.join(','))
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `attendance-course-summary-${dateInput || 'report'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Student Breakdown to CSV
  const handleExportStudentCSV = () => {
    if (!studentReports || studentReports.length === 0) return
    const headers = [
      'Register ID',
      'Student Name',
      'Course Name',
      'Total Sessions',
      'Present Sessions',
      'Attendance Rate (%)',
    ]
    const csvRows = [headers.join(',')]

    for (const s of studentReports) {
      const row = [
        s.register_id,
        `"${s.student_name.replace(/"/g, '""')}"`,
        `"${s.course_name.replace(/"/g, '""')}"`,
        s.sessions,
        s.present_sessions,
        Number(s.attendance_percent).toFixed(1),
      ]
      csvRows.push(row.join(','))
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `student-attendance-${courseInput || 'course'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Statistics Tiles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
            CLASSROOM SESSIONS & ROSTER
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-heading)]">
            Attendance Hub
          </h1>
          <p className="text-sm text-[var(--mute)] mt-1">
            Record student daily sessions, inspect curriculum attendance rates, and audit presence logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Overall Rate"
          value={`${kpiData.overallPct}%`}
          subtitle="Across all batches and recorded sessions"
          icon={<TrendingUp size={18} />}
          badge={{
            text: kpiData.overallPct >= 85 ? 'Healthy' : kpiData.overallPct >= 75 ? 'Fair' : 'At Risk',
            variant: kpiData.overallPct >= 85 ? 'success' : kpiData.overallPct >= 75 ? 'warning' : 'danger',
          }}
          variant="hero"
        />
        <KpiCard
          title="Batches Tracked"
          value={kpiData.activeCoursesCount}
          subtitle="Active course programs in session"
          icon={<GraduationCap size={18} />}
        />
        <KpiCard
          title="Total Sessions"
          value={kpiData.totalSessions}
          subtitle="Cumulative classroom hours marked"
          icon={<CalendarDays size={18} />}
        />
        <KpiCard
          title="At-Risk Batches"
          value={kpiData.atRiskCount}
          subtitle="Programs needing faculty attention"
          icon={<AlertTriangle size={18} />}
          badge={{
            text: kpiData.atRiskCount > 0 ? '<75% Attendance' : 'Optimal',
            variant: kpiData.atRiskCount > 0 ? 'danger' : 'success',
          }}
        />
      </div>

      {/* 2. Accessible Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 rounded-[22px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
        <div
          role="tablist"
          aria-label="Attendance views"
          className="inline-flex items-center p-1 rounded-full bg-[var(--panel)]"
        >
          <button
            type="button"
            role="tab"
            id="tab-marking"
            aria-selected={activeTab === 'marking'}
            aria-controls="panel-marking"
            onClick={() => handleTabChange('marking')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'marking' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={{
              background: activeTab === 'marking' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
            }}
          >
            <UserCheck size={14} />
            <span>Daily Marking</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-analytics"
            aria-selected={activeTab === 'analytics'}
            aria-controls="panel-analytics"
            onClick={() => handleTabChange('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={{
              background: activeTab === 'analytics' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
            }}
          >
            <BarChart3 size={14} />
            <span>Course & Student Analytics</span>
            {kpiData.atRiskCount > 0 && (
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: activeTab === 'analytics' ? 'rgba(255,255,255,0.25)' : 'var(--danger-bg)',
                  color: activeTab === 'analytics' ? '#fff' : '#b53c37',
                }}
              >
                {kpiData.atRiskCount} at risk
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-records"
            aria-selected={activeTab === 'records'}
            aria-controls="panel-records"
            onClick={() => handleTabChange('records')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'records' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={{
              background: activeTab === 'records' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
            }}
          >
            <FileText size={14} />
            <span>Records & Audit Log</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Panels */}

      {/* Panel 1: Daily Marking View */}
      {activeTab === 'marking' && (
        <div id="panel-marking" role="tabpanel" aria-labelledby="tab-marking" className="space-y-6">
          <section className="panel p-5 sm:p-7 shadow-xs border border-slate-200/90 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <CalendarCheck size={22} className="text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Mark attendance</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      Live Roster
                    </span>
                    {isTodaySelected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        Today&apos;s Session
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose a course curriculum batch and session date to load the live student roster.
                  </p>
                </div>
              </div>

              {/* Quick Date Switcher Controls */}
              <div className="flex items-center gap-1.5 bg-slate-50/90 p-1.5 rounded-xl border border-slate-200/80 text-xs shadow-2xs shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => handleDateShift(-1)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all flex items-center gap-1 cursor-pointer font-medium"
                  title="Previous Day"
                >
                  <ChevronLeft size={15} />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className={`px-3 py-1.5 rounded-lg font-semibold shadow-2xs border transition-all cursor-pointer ${
                    isTodaySelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-indigo-700 border-slate-200/90 hover:bg-indigo-50/80'
                  }`}
                  title="Jump to Today"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDateShift(1)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all flex items-center gap-1 cursor-pointer font-medium"
                  title="Next Day"
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Selection Form */}
            <form
              action="/attendance"
              onSubmit={(e) => {
                e.preventDefault()
                navigateWithParams(courseInput, dateInput)
              }}
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-50/80 via-slate-50/50 to-white border border-slate-200/80 shadow-2xs grid grid-cols-1 md:grid-cols-[1.6fr_1.2fr_auto] gap-4 items-end"
            >
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-600" />
                  Course Curriculum
                </span>
                <select
                  name="courseId"
                  required
                  value={courseInput}
                  onChange={(e) => {
                    setCourseInput(e.target.value)
                    if (e.target.value) {
                      navigateWithParams(e.target.value, dateInput)
                    }
                  }}
                  className="w-full min-h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium shadow-2xs hover:border-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="">Choose a course batch...</option>
                  {categories.map((cat) => {
                    const catCourses = courses.filter((c) => c.categoryId === cat.id)
                    if (!catCourses.length) return null
                    return (
                      <optgroup key={cat.id} label={`${cat.name} (${cat.duration})`}>
                        {catCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                  {courses.some((c) => !c.categoryId) && (
                    <optgroup label="Other / Uncategorized">
                      {courses
                        .filter((c) => !c.categoryId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-indigo-600" />
                    Session Date
                  </span>
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {formattedDateLabel}
                  </span>
                </div>
                <input
                  name="date"
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => {
                    setDateInput(e.target.value)
                    if (courseInput && e.target.value) {
                      navigateWithParams(courseInput, e.target.value)
                    }
                  }}
                  className="w-full min-h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium shadow-2xs hover:border-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all cursor-pointer"
                />
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary min-h-12 px-6 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Loading…</span>
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    <span>Load roster</span>
                  </>
                )}
              </button>
            </form>

            {/* Attendance Marking Table */}
            {selectedCourseId && selectedDate ? (
              <AttendanceMarking
                courseId={selectedCourseId}
                sessionDate={selectedDate}
                roster={roster}
                courseName={selectedCourseObj?.name}
                categoryName={selectedCourseObj?.categoryName || courseCategoryMap[selectedCourseId]}
                duration={selectedCourseObj?.duration}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200/90 p-8 sm:p-12 text-center bg-slate-50/50 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Users size={28} />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    Select a course to view and mark attendance
                  </h3>
                  <p className="text-sm text-slate-500">
                    Pick a course batch from the dropdown above or quick-select an active curriculum below.
                  </p>
                </div>

                {courses.length > 0 && (
                  <div className="pt-6 border-t border-slate-200/70 text-left max-w-3xl mx-auto">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      Quick Select Active Curriculum
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {courses.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCourseInput(c.id)
                            navigateWithParams(c.id, dateInput)
                          }}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between gap-2"
                        >
                          <div>
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                              {c.categoryName || 'Course'}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                              {c.name}
                            </h4>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <span>{c.duration || 'Standard'}</span>
                            <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                              Select &rarr;
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Session Activity / Quick Records Section */}
          <div className="pt-2">{recordsSection}</div>
        </div>
      )}

      {/* Panel 2: Course & Student Analytics */}
      {activeTab === 'analytics' && (
        <div id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics" className="space-y-6">
          {/* Course Summary Table */}
          <section className="panel shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Attendance by Course</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Percentage of attended sessions across active curricula, with risk alerts for rates below 75%.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCourseSummaryCSV}
                disabled={!courseReports || courseReports.length === 0}
                className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                title="Export course summary to CSV"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="data-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-900 tracking-wider">
                    <th className="py-3 px-4">Course Curriculum</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-center">Sessions Held</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 min-w-[180px]">Attendance Rate</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(courseReports ?? []).map((row) => {
                    const categoryName = courseCategoryMap[row.course_id]
                    const pct = Number(row.attendance_percent || 0)
                    const isHealthy = pct >= 85
                    const isFair = pct >= 75 && pct < 85
                    const isAtRisk = pct < 75

                    return (
                      <tr key={row.course_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{row.course_name}</td>
                        <td className="py-3.5 px-4">
                          {categoryName ? (
                            <CategoryBadge categoryName={categoryName} />
                          ) : (
                            <span className="text-xs text-slate-500 italic">Standard</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.students}</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">{row.sessions}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-emerald-700">{row.present_sessions}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-bold ${
                                  isHealthy ? 'text-emerald-700' : isFair ? 'text-amber-700' : 'text-rose-700'
                                }`}
                              >
                                {pct.toFixed(1)}%
                              </span>
                              {isAtRisk && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200">
                                  At Risk
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isHealthy ? 'bg-emerald-500' : isFair ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setCourseInput(row.course_id)
                              navigateWithParams(row.course_id, dateInput)
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Inspect Roster
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {courseReports?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No course attendance records have been registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Breakdown Section */}
          {selectedCourseId && (
            <section className="panel shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Student Attendance Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual attendance logs for students enrolled in the selected course.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportStudentCSV}
                  disabled={!studentReports || studentReports.length === 0}
                  className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                  title="Export student breakdown to CSV"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="data-wrap">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-900 tracking-wider">
                      <th className="py-3 px-4">Register ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Sessions Held</th>
                      <th className="py-3 px-4 text-center">Present</th>
                      <th className="py-3 px-4 min-w-[160px]">Attendance Rate</th>
                      <th className="py-3 px-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(studentReports ?? []).map((row) => {
                      const pct = Number(row.attendance_percent || 0)
                      const isHealthy = pct >= 85
                      const isFair = pct >= 75 && pct < 85
                      const isAtRisk = pct < 75

                      return (
                        <tr key={row.register_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-700">#{row.register_id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <Link
                              href={`/students/${row.register_id}`}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {row.student_name}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.sessions}</td>
                          <td className="py-3 px-4 text-center font-medium text-emerald-700">{row.present_sessions}</td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={`font-bold ${
                                    isHealthy ? 'text-emerald-700' : isFair ? 'text-amber-700' : 'text-rose-700'
                                  }`}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                                {isAtRisk && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200">
                                    Low
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isHealthy ? 'bg-emerald-500' : isFair ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/students/${row.register_id}`}
                              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:underline"
                            >
                              View &rarr;
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                    {studentReports?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                          No student records found for this selected course.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Panel 3: Full Records & Audit Log */}
      {activeTab === 'records' && (
        <div id="panel-records" role="tabpanel" aria-labelledby="tab-records">
          {recordsSection}
        </div>
      )}
    </div>
  )
}
