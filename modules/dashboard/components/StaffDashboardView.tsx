'use client'
import { useEffect, useState } from 'react'
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
import { CategoryBadge } from '@/components/CategoryBadge'
import { getTimeBasedGreeting } from '@/lib/greeting'

export function StaffDashboardView({
  data,
  canCreateStudent = true,
}: {
  data: StaffDashboardData
  canCreateStudent?: boolean
}) {
  const [greetingData, setGreetingData] = useState(() => getTimeBasedGreeting())

  useEffect(() => {
    setGreetingData(getTimeBasedGreeting())
  }, [])

  const {
    totalStudents,
    activeStudents,
    todayAttendance,
    materialsCount,
    assessmentCount,
    recentAssessments,
    lowAttendanceStudents,
    categoryMix = [],
  } = data

  return (
    <div className="space-y-6">
      {/* Header with Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Staff Portal
            </span>
            <span className="text-xs text-muted-foreground font-medium">{greetingData.formattedDate}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{greetingData.greeting}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{greetingData.subcopy}</p>
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

      {/* Row 1: Today's Attendance Summary & Attendance Watchlist (Equal 50% Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Today's Attendance Progress Box */}
        <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
          <div>
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

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          </div>

          {/* Attendance Progress Bar */}
          <div className="mt-5 pt-3.5 border-t border-slate-100">
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

        {/* Low Attendance Watchlist Card (Equal width & matching height) */}
        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Attendance Watchlist (&lt; 75%)</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {lowAttendanceStudents.length} Students
              </span>
            </div>

            <p className="text-xs text-amber-800 mt-2 mb-3">
              Students falling below 75% attendance criteria who require faculty follow-up.
            </p>
          </div>

          {lowAttendanceStudents.length === 0 ? (
            <div className="py-7 px-4 text-center text-xs text-emerald-800 bg-white/70 rounded-lg border border-emerald-100 flex-1 flex flex-col items-center justify-center">
              <CheckCircle2 size={22} className="mx-auto mb-1.5 text-emerald-600" />
              <span>All active students meet the 75% attendance threshold!</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {lowAttendanceStudents.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-lg bg-white border border-amber-200/70 shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{s.registerId}</span>
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

      {/* Row 2: Recent Assessments & Daily Faculty Checklist (Equal 50% Width, Aligned) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Recent Assessments Pipeline */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Recent Assessments</h2>
              </div>
              <Link href="/assessments" className="text-xs font-medium text-indigo-600 hover:underline">
                View all &rarr;
              </Link>
            </div>

            {recentAssessments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex-1 flex items-center justify-center">
                <span>
                  No assessments conducted yet.{' '}
                  <Link href="/assessments" className="text-indigo-600 font-medium hover:underline">
                    Create the first assessment
                  </Link>
                </span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 px-5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
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

        {/* Daily Faculty Checklist */}
        <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={15} className="text-indigo-600" />
                Daily Faculty Checklist
              </h3>
              <span className="text-[11px] font-medium text-slate-600">Classroom SOP</span>
            </div>
            <ul className="mt-4 space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Mark attendance promptly at the start of each theory and practical batch.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Upload weekly assignment files, project templates, and lab exercises in Course Materials.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Review low-attendance students and coordinate follow-up with student counselors.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Course Mix: Curriculum Categories & Internship Programs */}
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Course mix</h2>
            <p className="text-xs text-slate-500">
              Curriculum categories, duration tiers, and enrolled student breakdown
            </p>
          </div>
          <Link href="/courses" className="text-xs font-medium text-indigo-600 hover:underline">
            View courses &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Course mix" tabIndex={0}>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-5">Course Category</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-5 text-right">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryMix.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-slate-900 text-sm block">{row.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <CategoryBadge categoryName={row.name} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{row.duration}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-900 text-sm">{row.studentCount}</td>
                </tr>
              ))}
              {categoryMix.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No course categories configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
