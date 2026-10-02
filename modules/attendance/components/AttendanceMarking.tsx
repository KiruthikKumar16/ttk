'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Clock, Shield, Search, UserCheck, UserX } from 'lucide-react'

type Status = 'Present' | 'Absent' | 'Late' | 'Excused'
type Student = { registerId: number; name: string; status: string | null }
const statuses: Status[] = ['Present', 'Absent', 'Late', 'Excused']

export function AttendanceMarking({
  courseId,
  sessionDate,
  roster,
}: {
  courseId: string
  sessionDate: string
  roster: Student[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(roster)
  const [saving, setSaving] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Compute real-time session statistics
  const presentCount = rows.filter((r) => r.status === 'Present').length
  const absentCount = rows.filter((r) => r.status === 'Absent').length
  const lateCount = rows.filter((r) => r.status === 'Late').length
  const excusedCount = rows.filter((r) => r.status === 'Excused').length
  const unmarkedCount = rows.filter((r) => !r.status).length
  const presentPct = rows.length > 0 ? Math.round((presentCount / rows.length) * 100) : 0

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows
    const term = searchTerm.toLowerCase().trim()
    return rows.filter((r) => r.name.toLowerCase().includes(term) || String(r.registerId).includes(term))
  }, [rows, searchTerm])

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
          return 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
        case 'Absent':
          return 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
        case 'Late':
          return 'bg-amber-600 text-white border-amber-600 font-semibold shadow-xs'
        case 'Excused':
          return 'bg-sky-600 text-white border-sky-600 font-semibold shadow-xs'
      }
    }
    switch (status) {
      case 'Present':
        return 'bg-white text-emerald-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/70 font-medium'
      case 'Absent':
        return 'bg-white text-rose-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/70 font-medium'
      case 'Late':
        return 'bg-white text-amber-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/70 font-medium'
      case 'Excused':
        return 'bg-white text-sky-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/70 font-medium'
    }
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      {/* Live Session Summary Counter Chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-700 mr-1">Session Summary:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/80">
          Total: <strong>{rows.length}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
          Present:{' '}
          <strong>
            {presentCount} ({presentPct}%)
          </strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-medium border border-rose-200">
          Absent: <strong>{absentCount}</strong>
        </span>
        {lateCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
            Late: <strong>{lateCount}</strong>
          </span>
        )}
        {excusedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 font-medium border border-sky-200">
            Excused: <strong>{excusedCount}</strong>
          </span>
        )}
        {unmarkedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 font-medium border border-purple-200 animate-pulse">
            Unmarked: <strong>{unmarkedCount}</strong>
          </span>
        )}
      </div>

      {/* Roster Controls: Search & Bulk Action Buttons */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-8.5 py-1.5 text-xs w-full"
            aria-label="Filter roster students"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary min-h-9 py-1 px-3 text-xs inline-flex items-center gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
            disabled={rows.length === 0}
            onClick={markAllPresent}
          >
            <UserCheck size={14} className="text-emerald-600" />
            <span>Mark all present</span>
          </button>

          {unmarkedCount > 0 && (
            <button
              type="button"
              className="btn-secondary min-h-9 py-1 px-3 text-xs inline-flex items-center gap-1.5 border-rose-300 text-rose-800 hover:bg-rose-50 cursor-pointer"
              disabled={rows.length === 0}
              onClick={markRemainingAbsent}
            >
              <UserX size={14} className="text-rose-600" />
              <span>Mark remaining as absent</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Message */}
      <p role="status" aria-live="polite" className="mb-2 min-h-5 text-xs text-slate-500 font-medium">
        {message}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <p className="text-sm font-medium text-slate-700">No students are enrolled in this course</p>
          <p className="text-xs text-slate-500 mt-1">Please select another course or enroll students to view roster.</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center bg-slate-50">
          <p className="text-sm text-slate-600">No students match &ldquo;{searchTerm}&rdquo;</p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50/90 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Student Name
                </th>
                {statuses.map((status) => (
                  <th
                    key={status}
                    scope="col"
                    className="p-2 text-center font-semibold text-slate-700 text-xs uppercase tracking-wider"
                  >
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.map((row, index) => (
                <tr key={row.registerId} className="hover:bg-slate-50/80 transition-colors">
                  <th scope="row" className="p-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/students/${row.registerId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        title={`View profile for ${row.name}`}
                      >
                        {row.name}
                      </Link>
                      <span className="text-xs font-mono text-slate-400">#{row.registerId}</span>
                    </div>
                  </th>
                  {statuses.map((status, statusIndex) => {
                    const isSelected = row.status === status
                    return (
                      <td key={status} className="p-2 text-center">
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
                          }}
                          onClick={() => void setStatus(row.registerId, status)}
                          className={`min-h-9 px-3.5 py-1 rounded-lg border text-xs transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${getStatusButtonClass(status, isSelected)}`}
                        >
                          {isSelected ? '✓' : status}
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
    </div>
  )
}
