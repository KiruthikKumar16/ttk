'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
    <section className="panel p-4 sm:p-6">
      <form onSubmit={assign} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          Course
          <select className="input" value={courseId} onChange={(event) => setCourseId(event.target.value)} required>
            {courses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Trainer
          <select className="input" value={trainerId} onChange={(event) => setTrainerId(event.target.value)} required>
            {trainers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button disabled={!courseId || !trainerId} className="btn-primary min-h-11">
          Assign trainer
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm">
        {status}
      </p>
      <div className="data-wrap">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Trainer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((row) => (
              <tr key={`${row.courseId}-${row.trainerId}`}>
                <td>{courses.find((item) => item.id === row.courseId)?.name ?? row.courseId}</td>
                <td>{trainers.find((item) => item.id === row.trainerId)?.name ?? 'Trainer unavailable'}</td>
                <td>
                  <button className="btn-secondary" onClick={() => setRemove(row)}>
                    Unassign
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={3}>No trainer assignments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
