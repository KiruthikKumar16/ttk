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
import Link from 'next/link'
import type { Student, Course, CourseCategory } from '@/lib/types'
import type { AcademicReportData } from '@/modules/reports/service'
import { KpiCard } from '@/components/ui/KpiCard'

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
      totalTests > 0 ? Math.round(filteredAssessments.reduce((sum, a) => sum + a.avgScore, 0) / totalTests) : 0
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
    const headers = [
      'Assessment Title',
      'Course',
      'Date',
      'Max Score',
      'Avg Score',
      'Graded Submissions',
      'Passed',
      'Failed',
    ]
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Reports</h1>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'var(--panel)', color: 'var(--g1)' }}
            >
              Staff Academic Reports
            </span>
          </div>
          <p className="text-xs text-[var(--mute)] mt-1">
            Audit classroom attendance records, student evaluations, test pass rates, and learner retention.
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2.5 p-1.5 bg-[var(--card)] rounded-full border border-[var(--border)] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-[var(--mute)] px-2">
            <Calendar size={14} className="text-[var(--mute)]" />
            <input
              id="staff-rep-start-date"
              aria-label="Start date"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="text-xs border border-[var(--border)] rounded-full px-2.5 py-1 bg-[var(--card)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
            />
            <span>to</span>
            <input
              id="staff-rep-end-date"
              aria-label="End date"
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="text-xs border border-[var(--border)] rounded-full px-2.5 py-1 bg-[var(--card)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
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
              className="px-2.5 py-1 text-xs font-bold rounded-full bg-[var(--panel)] hover:bg-[var(--border)] text-[var(--text)] transition-colors"
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
              className="px-2.5 py-1 text-xs font-bold rounded-full bg-[var(--panel)] hover:bg-[var(--border)] text-[var(--text)] transition-colors"
            >
              30d
            </button>
            <button
              onClick={() => {
                const now = new Date()
                setStartDateStr(`${now.getFullYear()}-01-01`)
                setEndDateStr(now.toISOString().slice(0, 10))
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-full bg-[var(--panel)] hover:bg-[var(--border)] text-[var(--text)] transition-colors"
            >
              YTD
            </button>
          </div>
          <Link
            href={`/api/reports/export?startDate=${startDateStr}&endDate=${endDateStr}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--card)] transition-colors shadow-2xs"
          >
            <Download size={13} />
            Download CSV
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Period Attendance"
          value={`${attendanceStats.rate}%`}
          subtitle={`${attendanceStats.present} present / ${attendanceStats.total} logged sessions`}
          icon={Calendar}
        />

        <KpiCard
          title="Active Learners"
          value={students.length}
          subtitle={`${students.length} active in course batches`}
          icon={Users}
        />

        <KpiCard
          title="Assessments"
          value={assessmentStats.totalTests}
          subtitle={`${assessmentStats.totalSubmissions} submissions evaluated`}
          icon={ClipboardCheck}
        />

        <KpiCard
          title="Average Score"
          value={`${assessmentStats.avgScore}%`}
          subtitle={`${assessmentStats.passRate}% student pass rate`}
          icon={Award}
        />
      </div>

      {/* Tabs & Search / Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="inline-flex items-center p-1 rounded-full bg-[var(--panel)] border border-[var(--border)] gap-1">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'attendance' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={activeTab === 'attendance' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
          >
            Attendance Logs ({filteredAttendance.length})
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'assessments' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={activeTab === 'assessments' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
          >
            Assessments & Grading ({filteredAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'students' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={activeTab === 'students' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
          >
            Attendance Watchlist ({lowAttendanceStudents.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              type="text"
              aria-label="Search student or test"
              placeholder="Search student or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-[var(--border)] rounded-full w-48 focus:outline-none focus:ring-1 focus:ring-[var(--g1)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--mute)]"
            />
          </div>

          {/* Export Button */}
          {activeTab === 'attendance' && (
            <button
              onClick={handleExportAttendanceCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}

          {activeTab === 'assessments' && (
            <button
              onClick={handleExportAssessmentsCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Attendance Logs Table */}
      {activeTab === 'attendance' && (
        <div className="bg-[var(--card)] rounded-[22px] border border-[var(--border)] shadow-2xs overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--border)] text-xs">
            <thead className="bg-[var(--panel)]">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Date</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Student</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Course</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--mute)]">
                    No attendance records logged in this date range.
                  </td>
                </tr>
              ) : (
                filteredAttendance.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--panel)] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[var(--mute)]">
                      {new Date(r.sessionDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-[var(--text)]">
                      <div className="flex items-center gap-1.5">
                        <span>{r.studentName}</span>
                        <span className="text-[10px] text-[var(--mute)] font-mono">#{r.studentRegisterId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--mute)]">{r.courseName}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'Present'
                            ? 'bg-emerald-500/15 text-[#1b7a4b]'
                            : r.status === 'Late'
                              ? 'bg-amber-500/15 text-[#854d0e]'
                              : 'bg-rose-500/15 text-[#b53c37]'
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
            <div className="p-3 text-center text-xs text-[var(--mute)] bg-[var(--panel)] border-t border-[var(--border)]">
              Showing first 50 of {filteredAttendance.length} records. Click &quot;Export CSV&quot; for the complete
              file.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assessments Table */}
      {activeTab === 'assessments' && (
        <div className="bg-[var(--card)] rounded-[22px] border border-[var(--border)] shadow-2xs overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--border)] text-xs">
            <thead className="bg-[var(--panel)]">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Assessment</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Course</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Date</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Max Score</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Avg Score</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Submissions</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Pass / Fail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--mute)]">
                    No assessments recorded in this date range.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--panel)] transition-colors">
                    <td className="px-4 py-2.5 font-bold text-[var(--text)]">{a.title}</td>
                    <td className="px-4 py-2.5 text-[var(--mute)]">{a.courseName}</td>
                    <td className="px-4 py-2.5 font-mono text-[var(--mute)]">
                      {new Date(a.assessmentDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[var(--text)]">{a.maxScore}</td>
                    <td className="px-4 py-2.5 font-bold" style={{ color: 'var(--g1)' }}>
                      {a.avgScore}%
                    </td>
                    <td className="px-4 py-2.5 text-[var(--mute)]">{a.resultsCount} graded</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#1b7a4b] font-bold">{a.passCount} pass</span>
                        <span className="text-[var(--mute)]">/</span>
                        <span className="text-[#b53c37] font-semibold">{a.failCount} fail</span>
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
        <div className="bg-[var(--card)] rounded-[22px] border border-[var(--border)] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-[#854d0e]" />
                Students with Attendance Below 75%
              </h3>
              <p className="text-[11px] text-[var(--mute)] mt-0.5">
                Requires faculty review and outreach to prevent student dropouts.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#854d0e]">
              {lowAttendanceStudents.length} Students At Risk
            </span>
          </div>

          <table className="min-w-full divide-y divide-[var(--border)] text-xs">
            <thead className="bg-[var(--panel)]">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Student Name</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Register ID</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Course</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Sessions Attended</th>
                <th className="px-4 py-3 text-left font-bold text-[var(--mute)]">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {lowAttendanceStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#1b7a4b] font-bold">
                    All students meet or exceed the 75% attendance threshold.
                  </td>
                </tr>
              ) : (
                lowAttendanceStudents.map((s) => (
                  <tr key={s.registerId} className="hover:bg-[var(--panel)] transition-colors">
                    <td className="px-4 py-2.5 font-bold text-[var(--text)]">{s.name}</td>
                    <td className="px-4 py-2.5 font-mono text-[var(--mute)]">#{s.registerId}</td>
                    <td className="px-4 py-2.5 text-[var(--mute)]">{s.course}</td>
                    <td className="px-4 py-2.5 text-[var(--mute)]">
                      {s.present} of {s.total} sessions
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-[#b53c37]">
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
