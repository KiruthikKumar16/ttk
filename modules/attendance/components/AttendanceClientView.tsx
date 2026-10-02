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
} from 'lucide-react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { AttendanceMarking } from './AttendanceMarking'
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

  // Quick date change handlers
  const handleDateShift = (deltaDays: number) => {
    try {
      const current = new Date(dateInput || new Date())
      current.setDate(current.getDate() + deltaDays)
      const nextDate = current.toISOString().slice(0, 10)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Hub</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record student daily sessions, inspect curriculum attendance rates, and audit presence logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="panel p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Overall Rate</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1.5">
              <span>{kpiData.overallPct}%</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  kpiData.overallPct >= 85
                    ? 'bg-emerald-50 text-emerald-700'
                    : kpiData.overallPct >= 75
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                }`}
              >
                {kpiData.overallPct >= 85 ? 'Healthy' : kpiData.overallPct >= 75 ? 'Fair' : 'At Risk'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Batches Tracked</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{kpiData.activeCoursesCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Sessions</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{kpiData.totalSessions}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">At-Risk Batches</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1.5">
              <span>{kpiData.atRiskCount}</span>
              {kpiData.atRiskCount > 0 ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  &lt;75% Attendance
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  None
                </span>
              )}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              kpiData.atRiskCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* 2. Accessible Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 shadow-2xs">
        <div
          role="tablist"
          aria-label="Attendance views"
          className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/70 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            id="tab-marking"
            aria-selected={activeTab === 'marking'}
            aria-controls="panel-marking"
            onClick={() => handleTabChange('marking')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'marking'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCheck size={14} className={activeTab === 'marking' ? 'text-white' : 'text-slate-500'} />
            <span>Daily Marking</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-analytics"
            aria-selected={activeTab === 'analytics'}
            aria-controls="panel-analytics"
            onClick={() => handleTabChange('analytics')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={14} className={activeTab === 'analytics' ? 'text-white' : 'text-slate-500'} />
            <span>Course & Student Analytics</span>
            {kpiData.atRiskCount > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'analytics' ? 'bg-indigo-700 text-indigo-100' : 'bg-rose-100 text-rose-800'
                }`}
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
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText size={14} className={activeTab === 'records' ? 'text-white' : 'text-slate-500'} />
            <span>Records & Audit Log</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Panels */}

      {/* Panel 1: Daily Marking View */}
      {activeTab === 'marking' && (
        <div id="panel-marking" role="tabpanel" aria-labelledby="tab-marking" className="space-y-6">
          <section className="panel p-4 sm:p-6 shadow-xs border border-slate-200/90">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mark attendance</h2>
                <p className="text-xs text-slate-500">
                  Choose a course batch and session date to load the live student roster.
                </p>
              </div>

              {/* Quick Date Switcher Controls */}
              <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70 text-xs">
                <button
                  type="button"
                  onClick={() => handleDateShift(-1)}
                  className="px-2 py-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all flex items-center gap-1 cursor-pointer font-medium"
                  title="Previous Day"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="px-2.5 py-1 rounded-md bg-white text-indigo-600 font-semibold shadow-2xs border border-slate-200/80 hover:bg-indigo-50/50 transition-all cursor-pointer"
                  title="Jump to Today"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDateShift(1)}
                  className="px-2 py-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all flex items-center gap-1 cursor-pointer font-medium"
                  title="Next Day"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Selection Form */}
            <form action="/attendance" className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                Course Curriculum
                <select
                  name="courseId"
                  required
                  value={courseInput}
                  onChange={(e) => setCourseInput(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Choose a course</option>
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

              <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                Session Date
                <input
                  name="date"
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="input text-sm"
                />
              </label>

              <button className="btn-primary min-h-10 text-xs font-semibold px-5 cursor-pointer">Load roster</button>
            </form>

            {/* Attendance Marking Table */}
            {selectedCourseId && selectedDate ? (
              <AttendanceMarking courseId={selectedCourseId} sessionDate={selectedDate} roster={roster} />
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <Users size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Select a course to view and mark attendance</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick a course batch from the dropdown above and click &ldquo;Load roster&rdquo;.
                </p>
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
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600 tracking-wider">
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
                            <span className="text-xs text-slate-400 italic">Standard</span>
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
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600 tracking-wider">
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
