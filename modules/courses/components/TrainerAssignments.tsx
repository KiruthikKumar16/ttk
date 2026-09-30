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
    <section className="space-y-6">
      {/* Assignment form */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={assign} className="p-6 space-y-4 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:gap-4 sm:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Course</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs"
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Trainer</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs"
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
          <button disabled={!courseId || !trainerId} className="btn-primary min-h-10 px-4 py-2 text-sm font-medium">
            Assign trainer
          </button>
        </form>
      </div>

      {/* Status / Error */}
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-700 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}
      {status && (
        <p role="status" aria-live="polite" className="mb-3 text-sm text-green-700 bg-green-50 p-3 rounded">
          {status}
        </p>
      )}

      {/* Assignments table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Course
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Trainer
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((row) => (
              <tr key={`${row.courseId}-${row.trainerId}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {courses.find((item) => item.id === row.courseId)?.name ?? row.courseId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {trainers.find((item) => item.id === row.trainerId)?.name ?? 'Trainer unavailable'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="btn-secondary min-h-9 px-3 text-xs font-medium" onClick={() => setRemove(row)}>
                    Unassign
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No trainer assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
