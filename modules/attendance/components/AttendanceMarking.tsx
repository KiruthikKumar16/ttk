'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">
          Enrolled students <span className="text-muted-foreground">({rows.length})</span>
        </h2>
        <button
          type="button"
          className="btn-secondary min-h-11"
          disabled={rows.length === 0}
          onClick={() => {
            for (const row of rows) void setStatus(row.registerId, 'Present')
          }}
        >
          Mark all present
        </button>
      </div>
      <p role="status" aria-live="polite" className="mb-2 min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
      {rows.length === 0 ? (
        <p className="rounded border p-4 text-sm text-muted-foreground">
          No students are enrolled in this course, or the selected course has no roster.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-3">
                  Student
                </th>
                {statuses.map((status) => (
                  <th key={status} scope="col" className="p-2 text-center">
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.registerId} className="border-t">
                  <th scope="row" className="p-3 font-medium">
                    {row.name}
                    <span className="ml-2 text-xs text-muted-foreground">#{row.registerId}</span>
                  </th>
                  {statuses.map((status, statusIndex) => (
                    <td key={status} className="p-2 text-center">
                      <button
                        type="button"
                        data-student-index={index}
                        data-attendance-status={statusIndex}
                        aria-label={`${status} for ${row.name}`}
                        aria-pressed={row.status === status}
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
                              Math.min(rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                            )
                            document
                              .querySelector<HTMLButtonElement>(
                                `button[data-student-index="${targetIndex}"][data-attendance-status="${statusIndex}"]`,
                              )
                              ?.focus()
                          }
                        }}
                        onClick={() => void setStatus(row.registerId, status)}
                        className={`min-h-10 rounded border px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${row.status === status ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        {row.status === status ? '✓' : status}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
