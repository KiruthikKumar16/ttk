'use client'

import Link from 'next/link'
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  BookOpen,
  Plus,
} from 'lucide-react'
import type { StaffDashboardData } from '@/modules/dashboard/service'
import { Button } from '@/components/ui/button'

export function StaffDashboardView({
  data,
  canCreateStudent = true,
}: {
  data: StaffDashboardData
  canCreateStudent?: boolean
}) {
  const {
    totalStudents,
    activeStudents,
    todayAttendance,
    materialsCount,
    assessmentCount,
    recentAssessments,
    lowAttendanceStudents,
  } = data

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Header with Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Staff Portal
            </span>
            <span className="text-xs text-muted-foreground">{todayFormatted}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Good morning</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor daily attendance, grade assessments, track student engagement, and distribute course materials.
          </p>
        </div>

        {/* Quick Actions Dock */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/attendance">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs">
              <CalendarDays size={14} className="mr-1.5" />
              Mark Attendance
            </Button>
          </Link>
          <Link href="/assessments">
            <Button size="sm" variant="outline" className="text-xs font-medium border-slate-300">
              <ClipboardCheck size={14} className="mr-1.5 text-indigo-600" />
              Assessments
            </Button>
          </Link>
          <Link href="/materials">
            <Button size="sm" variant="outline" className="text-xs font-medium border-slate-300">
              <FolderOpen size={14} className="mr-1.5 text-amber-600" />
              Upload Materials
            </Button>
          </Link>
          {canCreateStudent && (
            <Link href="/students/new">
              <Button size="sm" variant="outline" className="text-xs font-medium border-slate-300">
                <Plus size={14} className="mr-1 text-emerald-600" />
                Add Student
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Top Academic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Students */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500 ml-2">total learners</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="font-semibold text-emerald-700">{activeStudents} active</span>
            <span className="text-slate-400">•</span>
            <Link href="/students" className="text-indigo-600 hover:underline">
              View roster &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 2: Today's Attendance */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Attendance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{todayAttendance.rate}%</span>
            <span className="text-xs text-slate-500 ml-2">present rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">{todayAttendance.present} present</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-600 font-medium">{todayAttendance.absent} absent</span>
          </div>
        </div>

        {/* Metric 3: Assessments */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessments</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{assessmentCount}</span>
            <span className="text-xs text-slate-500 ml-2">conducted</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Tests & evaluations</span>
            <Link href="/assessments" className="text-indigo-600 hover:underline">
              Grade &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 4: Course Materials */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Materials</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FolderOpen size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{materialsCount}</span>
            <span className="text-xs text-slate-500 ml-2">files published</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Syllabus & guides</span>
            <Link href="/materials" className="text-indigo-600 hover:underline">
              Library &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Today's status & Assessments) / Right Column (Attendance Alerts & Quick Links) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Attendance Progress Box */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Attendance Summary</h2>
              </div>
              <Link
                href="/attendance"
                className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
              >
                Open Attendance Sheet <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <p className="text-xs font-medium text-emerald-800">Present / Late</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{todayAttendance.present}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Students in session</p>
              </div>

              <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-100">
                <p className="text-xs font-medium text-rose-800">Absent</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">{todayAttendance.absent}</p>
                <p className="text-[11px] text-rose-700 mt-0.5">Marked absent today</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs font-medium text-slate-700">Total Marked</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{todayAttendance.totalMarked}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Records logged today</p>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Classroom Attendance Health</span>
                <span className="font-bold text-slate-900">{todayAttendance.rate}% Present</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, todayAttendance.rate))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent Assessments Pipeline */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Recent Assessments</h2>
              </div>
              <Link href="/assessments" className="text-xs font-medium text-indigo-600 hover:underline">
                View all &rarr;
              </Link>
            </div>

            {recentAssessments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No assessments conducted yet.{' '}
                <Link href="/assessments" className="text-indigo-600 font-medium hover:underline">
                  Create the first assessment
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{a.courseName}</span>
                        <span>•</span>
                        <span>Max score: {a.maxScore}</span>
                        <span>•</span>
                        <span>{new Date(a.assessmentDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <Link href={`/assessments`}>
                      <Button variant="ghost" size="sm" className="text-xs font-medium text-indigo-600 h-7 px-2">
                        View Results
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Attendance Risk Watchlist */}
        <div className="space-y-6">
          {/* Low Attendance Watchlist Card */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Attendance Watchlist (&lt; 75%)</span>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                {lowAttendanceStudents.length} Students
              </span>
            </div>

            <p className="text-[11px] text-amber-800 mt-2 mb-3">
              Students falling below 75% attendance criteria who require faculty follow-up.
            </p>

            {lowAttendanceStudents.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-800 bg-white/60 rounded-lg border border-emerald-100">
                <CheckCircle2 size={20} className="mx-auto mb-1 text-emerald-600" />
                All active students meet the 75% attendance threshold!
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {lowAttendanceStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg bg-white border border-amber-200/70 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 truncate">{s.name}</span>
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
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                        {s.rate}%
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {s.presentSessions}/{s.totalSessions} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Classroom Tips & Quick Guide */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600" />
              Daily Faculty Checklist
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Mark attendance promptly at the start of each theory/practical batch.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Upload weekly assignment files and lab exercises in Course Materials.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Review low-attendance students and coordinate with student counselors.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
