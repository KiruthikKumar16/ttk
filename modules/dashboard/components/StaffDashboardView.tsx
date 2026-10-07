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
import { KpiCard } from '@/components/ui/KpiCard'

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
    <div className="space-y-8">
      {/* Header with Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--g4)] text-[var(--g1)] border border-[var(--g3)]">
              Faculty Portal
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
              {greetingData.formattedDate}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-heading)]">
            {greetingData.greeting}
          </h1>
          <p className="text-sm text-[var(--mute)] mt-1">{greetingData.subcopy}</p>
        </div>

        {/* Quick Actions Dock */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/attendance" className="btn-primary" style={{ textDecoration: 'none' }}>
            <CalendarDays size={14} />
            <span>Mark Attendance</span>
          </Link>
          <Link href="/assessments" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ClipboardCheck size={14} style={{ color: 'var(--g1)' }} />
            <span>Assessments</span>
          </Link>
          <Link href="/materials" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <FolderOpen size={14} style={{ color: 'var(--g1)' }} />
            <span>Upload Materials</span>
          </Link>
          {canCreateStudent && (
            <Link href="/students/new" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <Plus size={14} style={{ color: '#1b7a4b' }} />
              <span>Add Student</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top Academic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Enrolled Students"
          value={totalStudents}
          subtitle={`${activeStudents} active learners`}
          icon={<Users size={18} />}
          variant="hero"
        />
        <KpiCard
          title="Today's Attendance"
          value={`${todayAttendance.rate}%`}
          subtitle={`${todayAttendance.present} present • ${todayAttendance.absent} absent`}
          icon={<CalendarDays size={18} />}
          badge={{
            text: `${todayAttendance.present} in session`,
            variant: todayAttendance.rate >= 75 ? 'success' : 'warning',
          }}
        />
        <KpiCard
          title="Assessments"
          value={assessmentCount}
          subtitle="Total conducted"
          icon={<ClipboardCheck size={18} />}
          badge={{ text: 'Studio ready', variant: 'neutral' }}
        />
        <KpiCard
          title="Study Materials"
          value={materialsCount}
          subtitle="Published resources"
          icon={<FolderOpen size={18} />}
          badge={{ text: 'Library', variant: 'neutral' }}
        />
      </div>

      {/* Row 1: Today's Attendance Summary & Attendance Watchlist (Equal 50% Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
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
                Open Attendance Sheet <ArrowRight size={12} />
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
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Present / Late</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{todayAttendance.present}</p>
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
                <p className="text-2xl font-bold text-rose-900 mt-1">{todayAttendance.absent}</p>
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
                <p className="text-2xl font-bold text-slate-900 mt-1">{todayAttendance.totalMarked}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Records logged today</p>
              </div>
            </div>
          </div>

          {/* Attendance Progress Bar */}
          <div className="mt-5 pt-3.5 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Classroom Attendance Health</span>
              <span className="font-bold text-slate-900">{todayAttendance.rate}% Present</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, todayAttendance.rate))}%`,
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Low Attendance Watchlist Card (Equal width & matching height) */}
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
                {lowAttendanceStudents.length} Students
              </span>
            </div>

            <p className="text-xs text-amber-800/90 mt-2 mb-3">
              Students falling below 75% attendance criteria who require faculty follow-up.
            </p>
          </div>

          {lowAttendanceStudents.length === 0 ? (
            <div className="py-7 px-4 text-center text-xs text-emerald-800 bg-white/70 rounded-xl border border-emerald-100 flex-1 flex flex-col items-center justify-center">
              <CheckCircle2 size={22} className="mx-auto mb-1.5 text-emerald-600" />
              <span className="font-medium">All active students meet the 75% attendance threshold!</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
              {lowAttendanceStudents.map((s) => {
                const isCritical = s.rate < 60
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-[18px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] flex items-center justify-between gap-3 transition-colors hover:border-[var(--g1)]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-heading)] truncate">{s.name}</span>
                        <span className="text-[10px] text-[var(--mute)] font-mono">#{s.registerId}</span>
                      </div>
                      <p className="text-[11px] text-[var(--mute)] truncate mt-0.5">{s.course}</p>
                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold mt-1 text-[var(--g1)] hover:underline"
                        >
                          <Phone size={11} />
                          <span>Call: {s.phone}</span>
                        </a>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isCritical
                            ? 'bg-[var(--danger-bg)] text-[#b53c37] border border-rose-200/50'
                            : 'bg-[var(--warning-bg)] text-[#a8710f] border border-amber-200/50'
                        }`}
                      >
                        {s.rate}%
                      </span>
                      <span className="block text-[10px] text-[var(--mute)] mt-0.5">
                        {s.presentSessions}/{s.totalSessions} sessions
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Recent Assessments & Daily Faculty Checklist (Equal 50% Width, Aligned) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Recent Assessments Pipeline */}
        <section className="panel flex flex-col justify-between">
          <div>
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} className="text-indigo-600" />
                <h2>Recent Assessments</h2>
              </div>
              <Link href="/assessments">View all &rarr;</Link>
            </div>

            {recentAssessments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex-1 flex items-center justify-center">
                <span>
                  No assessments conducted yet.{' '}
                  <Link href="/assessments" className="text-indigo-600 font-semibold hover:underline">
                    Create assessment
                  </Link>
                </span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 px-5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{a.courseName}</span>
                        <span>•</span>
                        <span>Max: {a.maxScore}</span>
                        <span>•</span>
                        <span>{new Date(a.assessmentDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <Link
                      href={`/assessments`}
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View Results &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Daily Faculty Checklist */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600" />
                Daily Faculty Checklist
              </h3>
              <span className="text-[11px] font-medium text-slate-500">Classroom SOP</span>
            </div>
            <ul className="mt-4 space-y-3.5 text-xs text-slate-600">
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

      {/* Course Mix: Curriculum Categories & Programs */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Course mix</h2>
            <p>Curriculum categories, duration tiers, and enrolled student breakdown</p>
          </div>
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
                  <td colSpan={4} className="empty-note">
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
