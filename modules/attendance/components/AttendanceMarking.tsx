'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  X,
  Clock,
  Shield,
  Search,
  UserCheck,
  UserX,
  Sparkles,
  AlertCircle,
  CalendarDays,
  GraduationCap,
  Filter,
} from 'lucide-react'

type Status = 'Present' | 'Absent' | 'Late' | 'Excused'
type Student = { registerId: number; name: string; status: string | null }
const statuses: Status[] = ['Present', 'Absent', 'Late', 'Excused']

interface AttendanceMarkingProps {
  courseId: string
  sessionDate: string
  roster: Student[]
  courseName?: string
  categoryName?: string | null
  duration?: string | null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (name.slice(0, 2) || 'ST').toUpperCase()
}

function formatSessionDate(dateStr: string) {
  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  } catch {
    // Fallback
  }
  return dateStr
}

export function AttendanceMarking({
  courseId,
  sessionDate,
  roster,
  courseName,
  categoryName,
  duration,
}: AttendanceMarkingProps) {
  const router = useRouter()
  const [rows, setRows] = useState(roster)
  const [saving, setSaving] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmarked' | 'Present' | 'Absent' | 'Late' | 'Excused'>(
    'all',
  )

  // Compute real-time session statistics
  const presentCount = rows.filter((r) => r.status === 'Present').length
  const absentCount = rows.filter((r) => r.status === 'Absent').length
  const lateCount = rows.filter((r) => r.status === 'Late').length
  const excusedCount = rows.filter((r) => r.status === 'Excused').length
  const unmarkedCount = rows.filter((r) => !r.status).length
  const markedCount = rows.length - unmarkedCount
  const completionPct = rows.length > 0 ? Math.round((markedCount / rows.length) * 100) : 0
  const presentPct = rows.length > 0 ? Math.round((presentCount / rows.length) * 100) : 0

  const filteredRows = useMemo(() => {
    let list = rows
    if (statusFilter === 'unmarked') {
      list = list.filter((r) => !r.status)
    } else if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }

    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase().trim()
    return list.filter((r) => r.name.toLowerCase().includes(term) || String(r.registerId).includes(term))
  }, [rows, statusFilter, searchTerm])

  async function setStatus(registerId: number, status: Status) {
    const previous = rows.find((row) => row.registerId === registerId)?.status ?? null
    setRows((current) => current.map((row) => (row.registerId === registerId ? { ...row, status } : row)))
    setSaving((current) => [...current, registerId])
    setMessage('Saving attendance…')
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: registerId, courseId, sessionDate, status }),
      })
      if (!response.ok) throw new Error('Could not save attendance. Please retry.')
      setMessage(`Attendance saved for ${rows.find((row) => row.registerId === registerId)?.name ?? 'student'}.`)
      router.refresh()
    } catch (error) {
      setRows((current) => current.map((row) => (row.registerId === registerId ? { ...row, status: previous } : row)))
      setMessage(error instanceof Error ? error.message : 'Could not save attendance. Please retry.')
    } finally {
      setSaving((current) => current.filter((id) => id !== registerId))
    }
  }

  const markAllPresent = () => {
    for (const row of rows) {
      void setStatus(row.registerId, 'Present')
    }
  }

  const markRemainingAbsent = () => {
    const unmarked = rows.filter((r) => !r.status)
    for (const row of unmarked) {
      void setStatus(row.registerId, 'Absent')
    }
  }

  const getStatusButtonClass = (status: Status, isSelected: boolean) => {
    if (isSelected) {
      switch (status) {
        case 'Present':
          return 'bg-[#1b7a4b] text-white border-[#1b7a4b] shadow-sm font-bold ring-2 ring-emerald-500/30'
        case 'Absent':
          return 'bg-[#b53c37] text-white border-[#b53c37] shadow-sm font-bold ring-2 ring-rose-500/30'
        case 'Late':
          return 'bg-[#a8710f] text-white border-[#a8710f] shadow-sm font-bold ring-2 ring-amber-500/30'
        case 'Excused':
          return 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm font-bold ring-2 ring-sky-500/30'
      }
    }
    switch (status) {
      case 'Present':
        return 'bg-[var(--card)] text-[var(--text)] border-[var(--border)] hover:border-[#1b7a4b] hover:bg-[var(--success-bg)] hover:text-[#1b7a4b] font-medium'
      case 'Absent':
        return 'bg-[var(--card)] text-[var(--text)] border-[var(--border)] hover:border-[#b53c37] hover:bg-[var(--danger-bg)] hover:text-[#b53c37] font-medium'
      case 'Late':
        return 'bg-[var(--card)] text-[var(--text)] border-[var(--border)] hover:border-[#a8710f] hover:bg-[var(--warning-bg)] hover:text-[#a8710f] font-medium'
      case 'Excused':
        return 'bg-[var(--card)] text-[var(--text)] border-[var(--border)] hover:border-[#0284c7] hover:bg-sky-50 hover:text-[#0284c7] font-medium'
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-200/80 space-y-6">
      {/* 1. Active Session Header & Progress Overview */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                <GraduationCap size={13} />
                Active Session
              </span>
              {categoryName && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {categoryName}
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-500 bg-white border border-slate-200">
                  {duration}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{courseName || 'Course Session'}</span>
            </h3>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CalendarDays size={15} className="text-indigo-600" />
                {formatSessionDate(sessionDate)}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-700">
                {rows.length} {rows.length === 1 ? 'student enrolled' : 'students enrolled'}
              </span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs min-w-[260px] lg:max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Marking Progress</span>
              <span className="font-bold text-slate-900">
                {markedCount} of {rows.length} ({completionPct}%)
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {rows.length > 0 && (
                <>
                  <div
                    style={{ width: `${(presentCount / rows.length) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Present: ${presentCount}`}
                  />
                  <div
                    style={{ width: `${(lateCount / rows.length) * 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`Late: ${lateCount}`}
                  />
                  <div
                    style={{ width: `${(excusedCount / rows.length) * 100}%` }}
                    className="bg-sky-500 h-full transition-all duration-300"
                    title={`Excused: ${excusedCount}`}
                  />
                  <div
                    style={{ width: `${(absentCount / rows.length) * 100}%` }}
                    className="bg-rose-500 h-full transition-all duration-300"
                    title={`Absent: ${absentCount}`}
                  />
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>{unmarkedCount === 0 ? '✓ All marked' : `${unmarkedCount} remaining`}</span>
              <span className="font-medium text-emerald-700">{presentPct}% attendance rate</span>
            </div>
          </div>
        </div>

        {/* Live Session Counter Badges */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700 mr-1">Roster Stats:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-slate-800 font-semibold border border-slate-200/90 shadow-2xs">
            Total: <strong>{rows.length}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-2xs">
            Present:{' '}
            <strong>
              {presentCount} ({presentPct}%)
            </strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-200 shadow-2xs">
            Absent: <strong>{absentCount}</strong>
          </span>
          {lateCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 shadow-2xs">
              Late: <strong>{lateCount}</strong>
            </span>
          )}
          {excusedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-sky-800 font-semibold border border-sky-200 shadow-2xs">
              Excused: <strong>{excusedCount}</strong>
            </span>
          )}
          {unmarkedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-800 font-semibold border border-purple-200 shadow-2xs animate-pulse">
              Unmarked: <strong>{unmarkedCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 2. Roster Controls: Search, Quick Filters & Bulk Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-10 pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              aria-label="Filter roster students"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unmarked')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'unmarked'
                  ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                  : unmarkedCount > 0
                    ? 'text-purple-700 bg-purple-100/70 hover:bg-purple-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unmarked ({unmarkedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Present')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'Present'
                  ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Absent')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'Absent'
                  ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-10 py-1.5 px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border border-emerald-300 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer"
            disabled={rows.length === 0}
            onClick={markAllPresent}
          >
            <UserCheck size={16} className="text-emerald-700" />
            <span>Mark all present</span>
          </button>

          {unmarkedCount > 0 && (
            <button
              type="button"
              className="min-h-10 py-1.5 px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border border-rose-300 text-rose-800 bg-rose-50/80 hover:bg-rose-100 shadow-2xs transition-all cursor-pointer"
              disabled={rows.length === 0}
              onClick={markRemainingAbsent}
            >
              <UserX size={16} className="text-rose-700" />
              <span>Mark remaining as absent</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Feedback Status Message Banner */}
      <div className="min-h-6 flex items-center">
        <p
          role="status"
          aria-live="polite"
          className={`text-xs sm:text-sm font-medium transition-all ${
            message.includes('Could not') || message.includes('offline')
              ? 'text-rose-600 flex items-center gap-1.5'
              : message.includes('Saving')
                ? 'text-indigo-600 flex items-center gap-1.5'
                : 'text-slate-600'
          }`}
        >
          {message}
        </p>
      </div>

      {/* 4. Student Roster Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-slate-50/60 space-y-2">
          <GraduationCap size={36} className="mx-auto text-slate-400 mb-2" />
          <p className="text-base font-semibold text-slate-800">No students enrolled in this course</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Please select another course or enroll students in this curriculum to view and mark attendance.
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center bg-slate-50 space-y-3">
          <p className="text-sm text-slate-700 font-medium">
            No students found matching <span className="font-semibold text-slate-900">&ldquo;{searchTerm}&rdquo;</span>{' '}
            {statusFilter !== 'all' && `with status ${statusFilter}`}
          </p>
          <div className="flex items-center justify-center gap-2">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all cursor-pointer"
              >
                Clear search query
              </button>
            )}
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                Reset status filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50/90 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-4 font-bold text-slate-700 text-xs uppercase tracking-wider w-[42%]">
                  Student Information
                </th>
                {statuses.map((status) => (
                  <th
                    key={status}
                    scope="col"
                    className="p-3 text-center font-bold text-slate-700 text-xs uppercase tracking-wider"
                  >
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, index) => (
                <tr key={row.registerId} className="hover:bg-slate-50/80 transition-colors">
                  <th scope="row" className="p-4 font-normal">
                    <div className="flex items-center gap-3">
                      {/* Avatar Initials Badge */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs">
                        {getInitials(row.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/students/${row.registerId}`}
                            className="font-semibold text-slate-900 hover:text-indigo-600 text-sm sm:text-base hover:underline truncate"
                            title={`View profile for ${row.name}`}
                          >
                            {row.name}
                          </Link>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                            #{row.registerId}
                          </span>
                          {saving.includes(row.registerId) && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                              <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                              Saving…
                            </span>
                          )}
                        </div>

                        {/* Status hint pill for immediate row scanning */}
                        <div className="mt-1 flex items-center gap-2">
                          {row.status ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                                row.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : row.status === 'Absent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                    : row.status === 'Late'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                      : 'bg-sky-50 text-sky-700 border border-sky-200/80'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  row.status === 'Present'
                                    ? 'bg-emerald-500'
                                    : row.status === 'Absent'
                                      ? 'bg-rose-500'
                                      : row.status === 'Late'
                                        ? 'bg-amber-500'
                                        : 'bg-sky-500'
                                }`}
                              />
                              {row.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Not marked yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </th>

                  {statuses.map((status, statusIndex) => {
                    const isSelected = row.status === status
                    return (
                      <td key={status} className="p-3 text-center">
                        <button
                          type="button"
                          data-student-index={index}
                          data-attendance-status={statusIndex}
                          aria-label={`${status} for ${row.name}`}
                          aria-pressed={isSelected}
                          disabled={saving.includes(row.registerId)}
                          onKeyDown={(event) => {
                            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                              event.preventDefault()
                              const next =
                                (statusIndex + (event.key === 'ArrowRight' ? 1 : statuses.length - 1)) % statuses.length
                              void setStatus(row.registerId, statuses[next])
                            }
                            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                              event.preventDefault()
                              const targetIndex = Math.max(
                                0,
                                Math.min(filteredRows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                              )
                              document
                                .querySelector<HTMLButtonElement>(
                                  `button[data-student-index="${targetIndex}"][data-attendance-status="${statusIndex}"]`,
                                )
                                ?.focus()
                            }
                            // Quick single-key shortcuts
                            const key = event.key.toLowerCase()
                            if (key === 'p') {
                              event.preventDefault()
                              void setStatus(row.registerId, 'Present')
                            } else if (key === 'a') {
                              event.preventDefault()
                              void setStatus(row.registerId, 'Absent')
                            } else if (key === 'l') {
                              event.preventDefault()
                              void setStatus(row.registerId, 'Late')
                            } else if (key === 'e') {
                              event.preventDefault()
                              void setStatus(row.registerId, 'Excused')
                            }
                          }}
                          onClick={() => void setStatus(row.registerId, status)}
                          className={`w-full min-h-10 sm:min-h-11 px-3 py-2 rounded-full border text-xs sm:text-sm transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--g1)] inline-flex items-center justify-center gap-1.5 ${getStatusButtonClass(
                            status,
                            isSelected,
                          )}`}
                        >
                          {isSelected ? (
                            <>
                              <Check size={14} strokeWidth={3} className="shrink-0" />
                              <span>{status}</span>
                            </>
                          ) : (
                            <span>{status}</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Keyboard Navigation Hint Footer */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">💡 Fast Marking:</span>
          <span>Use Arrow keys to navigate rows. Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">
            P
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">
            A
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">
            L
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">
            E
          </kbd>
          <span>for instant status.</span>
        </span>
        <span className="text-[11px] text-slate-500">All changes save automatically</span>
      </div>
    </div>
  )
}
