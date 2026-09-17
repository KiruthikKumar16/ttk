import { useState, useMemo } from 'react'
import { Plus, Search, BookOpen, Clock, IndianRupee, Edit3, Trash2, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Course } from '@/lib/types'
import { money } from '@/lib/formatters'

export function CoursesManager({
  courses,
  onSaveCourse,
  onDeleteCourse,
  gstRate = 18,
}: {
  courses: Course[]
  onSaveCourse: (course: Partial<Course>) => Promise<void>
  onDeleteCourse: (id: string) => Promise<void>
  gstRate?: number
}) {
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [fee, setFee] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const openAddModal = () => {
    setEditingCourse(null)
    setName('')
    setFee('')
    setDuration('3 Months')
    setDescription('')
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (c: Course) => {
    setEditingCourse(c)
    setName(c.name)
    setFee(String(c.fee))
    setDuration(c.duration)
    setDescription(c.description || '')
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCourse(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Please provide a course name.')
      return
    }
    const feeNum = Number(fee)
    if (isNaN(feeNum) || feeNum <= 0) {
      setFormError('Please enter a valid course fee greater than zero.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      await onSaveCourse({
        id: editingCourse ? editingCourse.id : undefined,
        name: name.trim(),
        fee: feeNum,
        duration: duration.trim() || '3 Months',
        description: description.trim(),
      })
      closeModal()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, courseName: string) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"?`)) {
      await onDeleteCourse(id)
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(query.toLowerCase())) ||
      c.duration.toLowerCase().includes(query.toLowerCase())
    )
  }, [courses, query])

  // Computed values for modal fee preview
  const enteredFee = Number(fee) || 0
  const modalGst = gstRate > 0 ? Math.round(enteredFee * (gstRate / 100)) : 0
  const modalTotal = enteredFee + modalGst

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Manage Courses</h1>
          <p>Configure academy curriculum programs, standard tuition fees, and durations</p>
        </div>
        <Button variant="default" size="default" onClick={openAddModal}>
          <Plus size={16} className="mr-1.5" />
          Add Course
        </Button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Course Catalog ({filteredCourses.length})</h2>
            <p>Tuition fees shown below are exclusive of GST ({gstRate > 0 ? `${gstRate}% GST applicable` : 'GST disabled'})</p>
          </div>
          <div className="search-box" style={{ maxWidth: 280 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search courses..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="data-wrap">
          <table className="w-full table-auto" style={{ whiteSpace: 'normal' }}>
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Course</th>
                <th style={{ width: '14%' }}>Duration</th>
                <th style={{ width: '26%' }}>Description</th>
                <th className="align-right" style={{ width: '18%', whiteSpace: 'nowrap' }}>
                  Fee {gstRate > 0 ? `(+${gstRate}% GST)` : ''}
                </th>
                <th className="align-right" style={{ width: '14%', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No courses found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map(c => {
                  const courseGst = gstRate > 0 ? Math.round(c.fee * (gstRate / 100)) : 0
                  const courseTotal = c.fee + courseGst
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="mini-avatar shrink-0" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            <BookOpen size={16} />
                          </div>
                          <div className="min-w-0">
                            <strong className="block font-semibold text-gray-900 leading-snug">{c.name}</strong>
                            <small className="block text-gray-400 font-mono text-xs">{c.id}</small>
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>{c.duration}</span>
                        </div>
                      </td>
                      <td>
                        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed" title={c.description}>
                          {c.description || '—'}
                        </p>
                      </td>
                      <td className="align-right" style={{ whiteSpace: 'nowrap' }}>
                        <div className="text-sm font-bold text-gray-900 leading-tight">
                          {money(courseTotal)}
                        </div>
                        {gstRate > 0 && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Base: {money(c.fee)} <span className="text-gray-400">+{money(courseGst)}</span>
                          </div>
                        )}
                      </td>
                      <td className="align-right" style={{ whiteSpace: 'nowrap' }}>
                        <div className="flex justify-end items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-ghost text-xs px-2.5 py-1"
                            onClick={() => openEditModal(c)}
                            title="Edit Course"
                          >
                            <Edit3 size={13} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-ghost text-xs px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(c.id, c.name)}
                            title="Delete Course"
                          >
                            <Trash2 size={13} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Course Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set standard tuition fee (exclusive of GST) and duration for this program.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Development"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 42000"
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Base fee before GST</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6 Months / 45 Days"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Live Fee + GST Preview Box */}
              {enteredFee > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-gray-700">
                  <div className="font-semibold text-gray-900 flex items-center justify-between">
                    <span>Fee Breakdown</span>
                    <span className="text-slate-500 font-normal">
                      {gstRate > 0 ? `GST @ ${gstRate}%` : 'GST Not Applicable'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Base Tuition:</span>
                    <span className="font-medium text-gray-900">{money(enteredFee)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST ({gstRate}%):</span>
                      <span className="font-medium text-gray-900">+{money(modalGst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-bold text-gray-900">
                    <span>Total Student Pays:</span>
                    <span className="text-blue-600">{money(modalTotal)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief curriculum overview or target skills..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
