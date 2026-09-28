import { useState, useMemo } from 'react'
import { ArrowLeft, ArrowUpRight, BarChart3, Bell, CheckCircle2, ChevronDown, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Printer, Search, Settings, ShieldCheck, Users, X, MoreHorizontal, Download, BookOpen, Clock, Edit, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Course } from '@/lib/types'
import { money } from '@/lib/formatters'
import { CourseMaterials } from '@/components/CourseMaterials'
import { calculateGstForRupees } from '@/lib/money'

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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [fee, setFee] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [gstInclusive, setGstInclusive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmCourseId, setConfirmCourseId] = useState<string | null>(null)
  const [confirmCourseName, setConfirmCourseName] = useState<string | null>(null)

  const openAddModal = () => {
    setEditingCourse(null)
    setName('')
    setFee('')
    setDuration('')
    setDescription('')
    setGstInclusive(false)
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (c: Course) => {
    setEditingCourse(c)
    setName(c.name)
    setFee(String(c.fee))
    setDuration(c.duration)
    setDescription(c.description || '')
    setGstInclusive(Boolean(c.gstInclusive))
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
        gstInclusive,
      })
      closeModal()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course.')
    } finally {
      setSubmitting(false)
    }
  }

  const openConfirmDelete = (id: string, courseName: string) => {
    setConfirmCourseId(id)
    setConfirmCourseName(courseName)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (confirmCourseId) {
      await onDeleteCourse(confirmCourseId)
    }
    setConfirmOpen(false)
    setConfirmCourseId(null)
    setConfirmCourseName(null)
  }

  const handleCancelDelete = () => {
    setConfirmOpen(false)
    setConfirmCourseId(null)
    setConfirmCourseName(null)
  }

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course)
  }

  const handleBackToCourseList = () => {
    setSelectedCourse(null)
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
  const modalBreakdown = calculateGstForRupees(enteredFee, gstRate, gstInclusive)
  const modalBase = modalBreakdown.taxableAmount
  const modalGst = modalBreakdown.gstAmount
  const modalTotal = modalBreakdown.totalAmount

  // If a course is selected, show the course details and materials
  if (selectedCourse) {
    const isInclusive = Boolean(selectedCourse.gstInclusive)
    const courseBreakdown = calculateGstForRupees(selectedCourse.fee, gstRate, isInclusive)
    const courseBase = courseBreakdown.taxableAmount
    const courseGst = courseBreakdown.gstAmount
    const courseTotal = courseBreakdown.totalAmount

    return (
      <div className="flex flex-col h-full">
        {/* Header with back button and course title */}
        <div className="flex flex-col items-start w-full mb-6 p-4 border-b border-gray-100">
          <Button variant="secondary" onClick={handleBackToCourseList}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Course List
          </Button>
          <div className="mt-4 text-left w-full">
            <p className="eyebrow">COURSE DETAILS</p>
            <h1 className="text-2xl font-bold">{selectedCourse.name}</h1>
            <p className="text-sm text-gray-500">
              Duration: {selectedCourse.duration} &bullet; Fee: {money(courseTotal)} {gstRate > 0 && `(${isInclusive ? 'GST Inclusive' : 'GST Exclusive'})`}
            </p>
            {selectedCourse.description && (
              <p className="mt-2 text-gray-600">{selectedCourse.description}</p>
            )}
          </div>
        </div>

        {/* Course Materials Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <CourseMaterials courseId={selectedCourse.id} />
        </div>
      </div>
    )
  }

  // If no course is selected, show the list of courses and the add button
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Manage Courses</h1>
          <p>Configure academy curriculum programs, standard tuition fees, and durations</p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={openAddModal} size="default">
            <Plus size={16} className="mr-1.5" />
            Add Course
          </Button>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Course Catalog ({filteredCourses.length})</h2>
            <p>Academy curriculum with GST Inclusive and Exclusive pricing ({gstRate > 0 ? `${gstRate}% GST applicable` : 'GST disabled'})</p>
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
                <th style={{ width: '26%' }}>Course</th>
                <th style={{ width: '13%' }}>Duration</th>
                <th style={{ width: '15%' }}>Tax Mode</th>
                <th style={{ width: '22%' }}>Description</th>
                <th className="align-right" style={{ width: '14%', whiteSpace: 'nowrap' }}>
                  Fee {gstRate > 0 ? `(${gstRate}% GST)` : ''}
                </th>
                <th className="align-right" style={{ width: '10%', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No courses found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map(c => {
                  const isInclusive = Boolean(c.gstInclusive)
                  const courseBreakdown = calculateGstForRupees(c.fee, gstRate, isInclusive)
                  const courseBase = courseBreakdown.taxableAmount
                  const courseGst = courseBreakdown.gstAmount
                  const courseTotal = courseBreakdown.totalAmount
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectCourse(c)}
                    >
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
                        {isInclusive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            GST Inclusive
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            GST Exclusive
                          </span>
                        )}
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
                            {isInclusive ? (
                              <>Base: {money(courseBase)} <span className="text-emerald-600 font-medium">({money(courseGst)} GST incl.)</span></>
                            ) : (
                              <>Base: {money(c.fee)} <span className="text-gray-400">+{money(courseGst)}</span></>
                            )}
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
                            <Edit size={13} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="btn-ghost text-xs px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openConfirmDelete(c.id, c.name)}
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
              )
              }
            </tbody>
          </table>
        </div>

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
                    Configure curriculum tuition fee, GST pricing mode, and duration.
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

                {/* GST Pricing Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    GST Calculation Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGstInclusive(false)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        !gstInclusive
                          ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-900">Exclusive of GST</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          !gstInclusive ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                        }`}>
                          {!gstInclusive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 leading-tight">
                        +GST added on top of fee
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGstInclusive(true)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        gstInclusive
                          ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-900">Inclusive of GST</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          gstInclusive ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                        }`}>
                          {gstInclusive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 leading-tight">
                        Fee already contains GST
                      </span>
                    </button>
                  </div>
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
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      {gstInclusive ? 'All-inclusive tuition fee' : 'Base tuition fee before GST'}
                    </span>
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
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-gray-700">
                    <div className="font-semibold text-gray-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        Fee Breakdown
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          gstInclusive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {gstInclusive ? 'GST Inclusive' : 'GST Exclusive'}
                        </span>
                      </span>
                      <span className="text-slate-500 font-normal">
                        {gstRate > 0 ? `GST @ ${gstRate}%` : 'GST Not Applicable'}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Base Tuition (Taxable):</span>
                      <span className="font-medium text-gray-900">{money(modalBase)}</span>
                    </div>
                    {gstRate > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>{gstInclusive ? `Included GST (${gstRate}%):` : `Applicable GST (${gstRate}%):`}</span>
                        <span className="font-medium text-gray-900">
                          {gstInclusive ? money(modalGst) : `+${money(modalGst)}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-bold text-gray-900">
                      <span>Total Student Pays:</span>
                      <span className={gstInclusive ? 'text-emerald-700' : 'text-blue-600'}>{money(modalTotal)}</span>
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
                    className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        {confirmOpen && (
          <ConfirmDialog
            isOpen={confirmOpen}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            title="Delete Course"
            description={`Are you sure you want to delete "${confirmCourseName}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            destructive
          />
        )}
      </section>
    </>
  )
}
