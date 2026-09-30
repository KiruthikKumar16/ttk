'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  Users,
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  Download,
  Search,
  AlertTriangle,
  Award,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Student, Course, CourseCategory } from '@/lib/types'
import type { AcademicReportData } from '@/modules/reports/service'

function parseDate(dateString?: string): Date {
  if (!dateString) return new Date(0)
  const d = new Date(dateString)
  return isNaN(d.getTime()) ? new Date(0) : d
}

export function StaffReportsView({
  students = [],
  academicData,
  categories = [],
  courses = [],
}: {
  students: Student[]
  academicData: AcademicReportData
  categories?: CourseCategory[]
  courses?: Course[]
}) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'assessments' | 'students'>('attendance')
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [endDateStr, setEndDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all')

  const startDate = useMemo(() => new Date(`${startDateStr}T00:00:00`), [startDateStr])
  const endDate = useMemo(() => new Date(`${endDateStr}T23:59:59.999`), [endDateStr])

  // Filter attendance records by date range and course
  const filteredAttendance = useMemo(() => {
    return academicData.attendanceRecords.filter((rec) => {
      const d = parseDate(rec.sessionDate)
      const matchesDate = d >= startDate && d <= endDate
      const matchesCourse = selectedCourseFilter === 'all' || rec.courseName === selectedCourseFilter
      const matchesSearch =
        !searchTerm ||
        rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(rec.studentRegisterId).includes(searchTerm)
      return matchesDate && matchesCourse && matchesSearch
    })
  }, [academicData.attendanceRecords, startDate, endDate, selectedCourseFilter, searchTerm])

  // Attendance metrics
  const attendanceStats = useMemo(() => {
    const total = filteredAttendance.length
    const present = filteredAttendance.filter((r) => r.status === 'Present' || r.status === 'Late').length
    const absent = filteredAttendance.filter((r) => r.status === 'Absent').length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, absent, rate }
  }, [filteredAttendance])

  // Filter assessments by date range
  const filteredAssessments = useMemo(() => {
    return academicData.assessmentRecords.filter((ass) => {
      const d = parseDate(ass.assessmentDate)
      const matchesDate = d >= startDate && d <= endDate
      const matchesCourse = selectedCourseFilter === 'all' || ass.courseName === selectedCourseFilter
      const matchesSearch = !searchTerm || ass.title.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesDate && matchesCourse && matchesSearch
    })
  }, [academicData.assessmentRecords, startDate, endDate, selectedCourseFilter, searchTerm])

  // Assessment metrics
  const assessmentStats = useMemo(() => {
    const totalTests = filteredAssessments.length
    const totalSubmissions = filteredAssessments.reduce((sum, a) => sum + a.resultsCount, 0)
    const avgScore =
      totalTests > 0
        ? Math.round(filteredAssessments.reduce((sum, a) => sum + a.avgScore, 0) / totalTests)
        : 0
    const totalPassed = filteredAssessments.reduce((sum, a) => sum + a.passCount, 0)
    const passRate = totalSubmissions > 0 ? Math.round((totalPassed / totalSubmissions) * 100) : 0
    return { totalTests, totalSubmissions, avgScore, passRate }
  }, [filteredAssessments])

  // Low attendance students in filtered set (< 75%)
  const lowAttendanceStudents = useMemo(() => {
    const map = new Map<string, { name: string; registerId: number; course: string; total: number; present: number }>()
    for (const r of academicData.attendanceRecords) {
      const current = map.get(r.studentId) || {
        name: r.studentName,
        registerId: r.studentRegisterId,
        course: r.courseName,
        total: 0,
        present: 0,
      }
      current.total += 1
      if (r.status === 'Present' || r.status === 'Late') current.present += 1
      map.set(r.studentId, current)
    }

    return Array.from(map.values())
      .filter((s) => s.total > 0 && (s.present / s.total) * 100 < 75)
      .map((s) => ({
        ...s,
        rate: Math.round((s.present / s.total) * 100),
      }))
      .sort((a, b) => a.rate - b.rate)
  }, [academicData.attendanceRecords])

  // CSV Export for Attendance
  const handleExportAttendanceCSV = () => {
    const headers = ['Session Date', 'Student ID', 'Student Name', 'Course', 'Status']
    const rows = filteredAttendance.map((r) => [
      r.sessionDate,
      `#${r.studentRegisterId}`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.courseName.replace(/"/g, '""')}"`,
      r.status,
    ])
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `academic_attendance_report_${startDateStr}_to_${endDateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSV Export for Assessments
  const handleExportAssessmentsCSV = () => {
    const headers = ['Assessment Title', 'Course', 'Date', 'Max Score', 'Avg Score', 'Graded Submissions', 'Passed', 'Failed']
    const rows = filteredAssessments.map((a) => [
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.courseName.replace(/"/g, '""')}"`,
      a.assessmentDate,
      a.maxScore,
      a.avgScore,
      a.resultsCount,
      a.passCount,
      a.failCount,
    ])
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `academic_assessments_report_${startDateStr}_to_${endDateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Staff Academic Reports
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Academic & Performance Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit classroom attendance records, student evaluations, test pass rates, and learner retention.
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span>to</span>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const now = new Date()
                const past = new Date()
                past.setDate(now.getDate() - 7)
                setStartDateStr(past.toISOString().slice(0, 10))
                setEndDateStr(now.toISOString().slice(0, 10))
              }}
              className="px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 text-slate-700"
            >
              7d
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const past = new Date()
                past.setDate(now.getDate() - 30)
                setStartDateStr(past.toISOString().slice(0, 10))
                setEndDateStr(now.toISOString().slice(0, 10))
              }}
              className="px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 text-slate-700"
            >
              30d
            </button>
            <button
              onClick={() => {
                const now = new Date()
                setStartDateStr(`${now.getFullYear()}-01-01`)
                setEndDateStr(now.toISOString().slice(0, 10))
              }}
              className="px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 text-slate-700"
            >
              YTD
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Period Attendance</span>
            <Calendar size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{attendanceStats.rate}%</span>
            <span className="text-xs text-slate-500">present rate</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {attendanceStats.present} present / {attendanceStats.total} logged sessions
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Active Learners</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{students.length}</span>
            <span className="text-xs text-slate-500">enrolled total</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {students.length} active in course batches
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Assessments</span>
            <ClipboardCheck size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{assessmentStats.totalTests}</span>
            <span className="text-xs text-slate-500">conducted</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {assessmentStats.totalSubmissions} submissions evaluated
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Average Score</span>
            <Award size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{assessmentStats.avgScore}%</span>
            <span className="text-xs text-slate-500">cohort average</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {assessmentStats.passRate}% student pass rate
          </p>
        </div>
      </div>

      {/* Tabs & Search / Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Attendance Logs ({filteredAttendance.length})
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'assessments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Assessments & Grading ({filteredAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Attendance Watchlist ({lowAttendanceStudents.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Export Button */}
          {activeTab === 'attendance' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportAttendanceCSV}
              className="text-xs font-medium border-slate-300 gap-1.5"
            >
              <Download size={13} />
              Export CSV
            </Button>
          )}

          {activeTab === 'assessments' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportAssessmentsCSV}
              className="text-xs font-medium border-slate-300 gap-1.5"
            >
              <Download size={13} />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Attendance Logs Table */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Student</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Course</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No attendance records logged in this date range.
                  </td>
                </tr>
              ) : (
                filteredAttendance.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      {new Date(r.sessionDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{r.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{r.studentRegisterId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{r.courseName}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredAttendance.length > 50 && (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
              Showing first 50 of {filteredAttendance.length} records. Click &quot;Export CSV&quot; for the complete file.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assessments Table */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Assessment</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Course</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Max Score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Avg Score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Submissions</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Pass / Fail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No assessments recorded in this date range.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{a.title}</td>
                    <td className="px-4 py-2.5 text-slate-600">{a.courseName}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      {new Date(a.assessmentDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{a.maxScore}</td>
                    <td className="px-4 py-2.5 font-semibold text-indigo-700">{a.avgScore}%</td>
                    <td className="px-4 py-2.5 text-slate-600">{a.resultsCount} graded</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-700 font-semibold">{a.passCount} pass</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-700 font-medium">{a.failCount} fail</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Attendance Watchlist (< 75%) */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-600" />
                Students with Attendance Below 75%
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Requires faculty review and outreach to prevent student dropouts.
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {lowAttendanceStudents.length} Students At Risk
            </span>
          </div>

          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Register ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Course</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Sessions Attended</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowAttendanceStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-emerald-700 font-medium">
                    All students meet or exceed the 75% attendance threshold.
                  </td>
                </tr>
              ) : (
                lowAttendanceStudents.map((s) => (
                  <tr key={s.registerId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">#{s.registerId}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.course}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {s.present} of {s.total} sessions
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                        {s.rate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
