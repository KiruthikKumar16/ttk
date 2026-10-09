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
import { ModernTable } from '@/components/ui/ModernTable'
import { TodayAttendanceSummary } from './TodayAttendanceSummary'
import { AttendanceWatchlistCard } from './AttendanceWatchlistCard'

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
            <span className="relative z-10 transition-colors duration-200 group-hover:text-white">Mark Attendance</span>
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
            <span className="relative z-10 transition-colors duration-200 group-hover:text-white">Assessments ({assessmentCount})</span>
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
            <span className="relative z-10 transition-colors duration-200 group-hover:text-white">Upload Materials</span>
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
      </div>

      {/* Top Academic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Enrolled Students"
          value={totalStudents}
          subtitle={`${activeStudents} active learners`}
          icon={<Users size={18} />}
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
        {/* Today's Attendance Summary with Donut Pattern Chart (Strictly Present & Absent) */}
        <TodayAttendanceSummary
          present={todayAttendance.present}
          absent={todayAttendance.absent}
          totalMarked={todayAttendance.totalMarked}
          rate={todayAttendance.rate}
          linkHref="/attendance"
          linkLabel="Open Attendance Sheet"
        />

        {/* Low Attendance Watchlist Card (Equal width & matching height) */}
        <AttendanceWatchlistCard students={lowAttendanceStudents} />
      </div>

      {/* Row 2: Recent Assessments & Daily Faculty Checklist (Equal 50% Width, Aligned) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Recent Assessments Pipeline */}
        <section className="panel flex flex-col justify-between overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_var(--g1b,rgba(0,0,0,0.12))] hover:border-[var(--g5)]">
          <div>
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} style={{ color: 'var(--g1)' }} />
                <h2>Recent Assessments</h2>
              </div>
              <Link href="/assessments">View all &rarr;</Link>
            </div>

            {recentAssessments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex-1 flex items-center justify-center">
                <span>
                  No assessments conducted yet.{' '}
                  <Link href="/assessments" className="text-[var(--g1)] font-semibold hover:underline">
                    Create assessment
                  </Link>
                </span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/70">
                {recentAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 px-5 hover:bg-[var(--g4)] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-heading)] truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--mute)]">
                        <span className="font-medium text-[var(--text)]">{a.courseName}</span>
                        <span>•</span>
                        <span>Max: {a.maxScore}</span>
                        <span>•</span>
                        <span>{new Date(a.assessmentDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <Link
                      href={`/assessments`}
                      className="inline-flex items-center text-xs font-semibold text-[var(--g1)] hover:underline"
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
        <div className="panel p-5 flex flex-col justify-between transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_var(--g1b,rgba(0,0,0,0.12))] hover:border-[var(--g5)]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} style={{ color: 'var(--g1)' }} />
                Daily Faculty Checklist
              </h3>
              <span className="text-[11px] font-medium text-slate-500">Classroom SOP</span>
            </div>
            <ul className="mt-4 space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--g1)] mt-1.5 shrink-0" />
                <span>Mark attendance promptly at the start of each theory and practical batch.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--g1)] mt-1.5 shrink-0" />
                <span>Upload weekly assignment files, project templates, and lab exercises in Course Materials.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--g1)] mt-1.5 shrink-0" />
                <span>Review low-attendance students and coordinate follow-up with student counselors.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Course Mix: Curriculum Categories & Programs */}
      <section className="panel overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_var(--g1b,rgba(0,0,0,0.12))] hover:border-[var(--g5)]">
        <div className="panel-header">
          <div>
            <h2>Course mix</h2>
            <p className="text-xs text-[var(--mute)] mt-0.5">Curriculum categories, course variants, and enrolled student breakdown</p>
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
            rows={categoryMix.map((row) => {
              const isInternship = row.name.toLowerCase().includes('internship')
              const variantsCount = row.courseNames?.length || 1
              const cleanCourseNames = isInternship
                ? row.courseNames?.map((n) => n.replace(/course\s*[-–]\s*/gi, '').replace(/\bcourse\b/gi, 'Track').trim())
                : row.courseNames

              return {
                id: row.id,
                cells: [
                  <div key="name" className="flex flex-col">
                    <span className="font-semibold text-[var(--text-heading)]">{row.name}</span>
                  </div>,
                  <div key="variants" className="flex flex-col">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--g4)] text-[var(--g1)] border border-[var(--g5)] w-fit"
                      title={cleanCourseNames?.join(', ')}
                    >
                      <span>
                        {isInternship
                          ? 'Type: Internship'
                          : `${variantsCount} ${variantsCount === 1 ? 'Course' : 'Courses'}`}
                      </span>
                    </span>
                    {cleanCourseNames && cleanCourseNames.length > 0 && (
                      <span className="text-[11px] text-[var(--mute)] truncate max-w-xs mt-1" title={cleanCourseNames.join(', ')}>
                        {isInternship
                          ? (cleanCourseNames[0] || 'Industry Internship Track')
                          : `${cleanCourseNames.slice(0, 2).join(', ')}${cleanCourseNames.length > 2 ? ` +${cleanCourseNames.length - 2} more` : ''}`}
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
              }
            })}
            emptyMessage="No course categories configured."
          />
        </div>
      </section>
    </div>
  )
}
