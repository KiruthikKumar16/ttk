'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'
import { UserCheck, BookOpen, Trash2 } from 'lucide-react'

type Course = { id: string; name: string }
type Trainer = { id: string; name: string }
type Assignment = { courseId: string; trainerId: string }

export function TrainerAssignments({
  courses,
  trainers,
  initialAssignments,
}: {
  courses: Course[]
  trainers: Trainer[]
  initialAssignments: Assignment[]
}) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? '')
  const [remove, setRemove] = useState<Assignment | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function assign(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const response = await fetch('/api/course-trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, trainerId }),
    })
    if (!response.ok) {
      setError('Could not assign this trainer. Please retry.')
      return
    }
    setAssignments((rows) =>
      rows.some((row) => row.courseId === courseId && row.trainerId === trainerId)
        ? rows
        : [...rows, { courseId, trainerId }],
    )
    setStatus('Trainer assigned to course.')
  }

  async function unassign() {
    if (!remove) return
    const query = new URLSearchParams(remove)
    const response = await fetch(`/api/course-trainers?${query}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
      setError('Could not remove this trainer assignment. Please retry.')
      return
    }
    setAssignments((rows) =>
      rows.filter((row) => row.courseId !== remove.courseId || row.trainerId !== remove.trainerId),
    )
    setRemove(null)
    setStatus('Trainer unassigned from course.')
  }

  return (
    <section className="space-y-6">
      {/* Assignment form card */}
      <Card className="p-6">
        <form onSubmit={assign} className="space-y-4 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:gap-4 sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="trainer-course-select" className="text-xs font-semibold text-[var(--ink)] block">
              Course
            </label>
            <select
              id="trainer-course-select"
              aria-label="Course"
              className="w-full px-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors cursor-pointer font-medium"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="trainer-person-select" className="text-xs font-semibold text-[var(--ink)] block">
              Trainer
            </label>
            <select
              id="trainer-person-select"
              aria-label="Trainer"
              className="w-full px-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors cursor-pointer font-medium"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              required
            >
              {trainers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <PillButton
              type="submit"
              variant="primary"
              disabled={!courseId || !trainerId}
              icon={<UserCheck size={15} />}
            >
              Assign trainer
            </PillButton>
          </div>
        </form>
      </Card>

      {/* Status / Error */}
      {error && (
        <p role="alert" className="p-3.5 rounded-2xl bg-[rgba(181,60,55,0.08)] border border-[rgba(181,60,55,0.25)] text-xs text-[#b53c37] font-medium">
          {error}
        </p>
      )}
      {status && (
        <p role="status" aria-live="polite" className="p-3.5 rounded-2xl bg-[rgba(27,122,75,0.08)] border border-[rgba(27,122,75,0.25)] text-xs text-[#1b7a4b] font-medium">
          {status}
        </p>
      )}

      {/* Assignments table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[26px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 px-5">
                  Course
                </th>
                <th scope="col" className="py-3 px-5">
                  Trainer
                </th>
                <th scope="col" className="py-3 px-5 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {assignments.map((row) => (
                <tr key={`${row.courseId}-${row.trainerId}`} className="hover:bg-[var(--panel)] transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-[var(--ink)]">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-[var(--g1)] shrink-0" />
                      <span>{courses.find((item) => item.id === row.courseId)?.name ?? row.courseId}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-[var(--ink)] font-medium">
                    {trainers.find((item) => item.id === row.trainerId)?.name ?? 'Trainer unavailable'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <PillButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemove(row)}
                      icon={<Trash2 size={13} className="text-[#b53c37]" />}
                    >
                      Unassign
                    </PillButton>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-[var(--mute)]">
                    No trainer assignments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={remove !== null}
        title="Unassign trainer?"
        description="The trainer will lose access to this course's attendance, assessments, and materials."
        destructive
        confirmText="Unassign"
        onCancel={() => setRemove(null)}
        onConfirm={() => void unassign()}
      />
    </section>
  )
}
