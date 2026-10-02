import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  BookOpen,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Search,
  X,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Course, CourseCategory } from '@/lib/types'
import { money } from '@/lib/formatters'
import { calculateGstForRupees } from '@/lib/money'
import { CategoryBadge, getCategoryBadgeStyle } from '@/components/CategoryBadge'

export function CoursesManager({
  courses,
  categories = [],
  selectedCategoryId,
  onSaveCourse,
  onDeleteCourse,
  gstRate = 18,
  search = '',
  page = 1,
  pageSize = 25,
  totalCount = courses.length,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  canManageCategories = false,
  sort = 'name',
  direction = 'asc',
}: {
  courses: Course[]
  categories?: CourseCategory[]
  selectedCategoryId?: string
  onSaveCourse: (course: Partial<Course>) => Promise<void>
  onDeleteCourse: (id: string) => Promise<void>
  gstRate?: number
  search?: string
  page?: number
  pageSize?: number
  totalCount?: number
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  canManageCategories?: boolean
  sort?: string
  direction?: 'asc' | 'desc'
}) {
  const [query, setQuery] = useState(search)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const router = useRouter()

  // Form state
  const [name, setName] = useState('')
  const [fee, setFee] = useState('')
  const [duration, setDuration] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [gstInclusive, setGstInclusive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Security confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<Course | null>(null)
  const [deleteInputName, setDeleteInputName] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleCategorySelect = (selectedId: string) => {
    setCategoryId(selectedId)
    if (selectedId && selectedId !== 'none') {
      const cat = categories.find((c) => c.id === selectedId)
      if (cat) {
        setDuration(cat.duration)
      }
    }
  }

  const openAddModal = () => {
    setEditingCourse(null)
    setName('')
    setFee('')
    const initialCat =
      selectedCategoryId && selectedCategoryId !== 'uncategorized'
        ? categories.find((c) => c.id === selectedCategoryId)
        : categories[0]
    if (initialCat) {
      setCategoryId(initialCat.id)
      setDuration(initialCat.duration)
    } else {
      setCategoryId('')
      setDuration('6 weeks')
    }
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
    setCategoryId(c.categoryId || '')
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
        duration: duration.trim() || '6 weeks',
        description: description.trim(),
        gstInclusive,
        categoryId: categoryId && categoryId !== 'none' ? categoryId : null,
      })
      closeModal()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course.')
    } finally {
      setSubmitting(false)
    }
  }

  const openSecurityDeleteModal = (course: Course) => {
    setDeleteConfirmCourse(course)
    setDeleteInputName('')
    setDeleteError('')
    setDeleteConfirmOpen(true)
  }

  const closeSecurityDeleteModal = () => {
    setDeleteConfirmOpen(false)
    setDeleteConfirmCourse(null)
    setDeleteInputName('')
    setDeleteError('')
    setDeleting(false)
  }

  const isDeleteNameMatched =
    Boolean(deleteConfirmCourse?.name) &&
    deleteInputName.trim().toLowerCase() === (deleteConfirmCourse?.name || '').trim().toLowerCase()

  const handleConfirmDelete = async () => {
    if (!deleteConfirmCourse) return
    if (!isDeleteNameMatched) {
      setDeleteError('The course name you entered does not match.')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await onDeleteCourse(deleteConfirmCourse.id)
      closeSecurityDeleteModal()
      closeModal()
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete course. Please check if active dependencies prevent removal.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(query.toLowerCase())) ||
        c.duration.toLowerCase().includes(query.toLowerCase()) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(query.toLowerCase())),
    )
  }, [courses, query])

  // Computed values for modal fee preview
  const enteredFee = Number(fee) || 0
  const modalBreakdown = calculateGstForRupees(enteredFee, gstRate, gstInclusive)
  const modalBase = modalBreakdown.taxableAmount
  const modalGst = modalBreakdown.gstAmount
  const modalTotal = modalBreakdown.totalAmount

  const availableDurations = useMemo(() => {
    const list: { duration: string; label: string }[] = []
    const seen = new Set<string>()

    categories.forEach((cat) => {
      const dur = cat.duration.trim()
      if (dur && !seen.has(dur.toLowerCase())) {
        seen.add(dur.toLowerCase())
        list.push({
          duration: dur,
          label: `${dur} (${cat.name})`,
        })
      }
    })

    if (duration && !seen.has(duration.trim().toLowerCase())) {
      list.push({
        duration: duration.trim(),
        label: duration.trim(),
      })
    }

    return list
  }, [categories, duration])

  const makeCategoryTabUrl = (catId?: string) => {
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    if (catId) params.set('categoryId', catId)
    if (sort) params.set('sort', sort)
    if (direction) params.set('direction', direction)
    params.set('pageSize', String(pageSize))
    return `/courses?${params.toString()}`
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Manage Courses</h1>
          <p>Configure academy curriculum programs, duration tiers, tuition fees, and GST pricing</p>
        </div>
        <div className="flex items-center gap-3">
          {canManageCategories && (
            <Link
              href="/settings/course-categories"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Layers size={16} className="text-gray-500" />
              Configure Categories
            </Link>
          )}
          {canCreate && (
            <Button onClick={openAddModal} size="default" className="flex items-center gap-1.5">
              <Plus size={16} />
              Add Course
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={makeCategoryTabUrl(undefined)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !selectedCategoryId
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Courses
          </Link>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id
            const isInternship = cat.name.toLowerCase().includes('internship')
            const isElite = cat.name.toLowerCase().includes('elite')
            const isEssential = cat.name.toLowerCase().includes('essential')
            const activeBg = isInternship
              ? 'bg-emerald-600 text-white shadow-xs'
              : isElite
                ? 'bg-purple-600 text-white shadow-xs'
                : isEssential
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-blue-600 text-white shadow-xs'
            const badgeBg = isInternship
              ? 'bg-emerald-100 text-emerald-800'
              : isElite
                ? 'bg-purple-100 text-purple-800'
                : isEssential
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-600'

            return (
              <Link
                key={cat.id}
                href={makeCategoryTabUrl(cat.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? activeBg
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : badgeBg}`}
                >
                  {cat.duration}
                </span>
              </Link>
            )
          })}
          <Link
            href={makeCategoryTabUrl('uncategorized')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedCategoryId === 'uncategorized'
                ? 'bg-gray-700 text-white shadow-xs'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Uncategorized
          </Link>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              {selectedCategoryId
                ? selectedCategoryId === 'uncategorized'
                  ? 'Uncategorized Courses'
                  : `${categories.find((c) => c.id === selectedCategoryId)?.name || 'Filtered'} Courses (${filteredCourses.length})`
                : `Course Catalog (${filteredCourses.length})`}
            </h2>
            <p>
              Academy curriculum with GST Inclusive and Exclusive pricing (
              {gstRate > 0 ? `${gstRate}% GST applicable` : 'GST disabled'})
            </p>
          </div>
          <form action="/courses" method="get" className="search-box" style={{ maxWidth: 300 }}>
            <Search size={16} />
            <input
              name="search"
              aria-label="Search courses"
              type="text"
              placeholder="Search courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {selectedCategoryId && <input type="hidden" name="categoryId" value={selectedCategoryId} />}
            <input type="hidden" name="pageSize" value={pageSize} />
            <label className="sr-only" htmlFor="course-sort">
              Sort courses by
            </label>
            <select id="course-sort" name="sort" defaultValue={sort}>
              <option value="name">Name</option>
              <option value="fee">Fee</option>
              <option value="duration">Duration</option>
            </select>
            <input type="hidden" name="direction" value={direction} />
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        </div>

        <div className="data-wrap" role="region" aria-label="Course list" tabIndex={0}>
          <table className="w-full table-auto" style={{ whiteSpace: 'normal' }}>
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Course</th>
                <th style={{ width: '15%' }}>Category</th>
                <th style={{ width: '12%' }}>Duration</th>
                <th style={{ width: '13%' }}>Tax Mode</th>
                <th style={{ width: '20%' }}>Description</th>
                <th className="align-right" style={{ width: '12%', whiteSpace: 'nowrap' }}>
                  Fee {gstRate > 0 ? `(${gstRate}% GST)` : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">No courses found matching your criteria.</p>
                    <p className="text-xs text-gray-400 mt-1">Try switching categories or clearing search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const isInclusive = Boolean(c.gstInclusive)
                  const courseBreakdown = calculateGstForRupees(c.fee, gstRate, isInclusive)
                  const courseBase = courseBreakdown.taxableAmount
                  const courseGst = courseBreakdown.gstAmount
                  const courseTotal = courseBreakdown.totalAmount
                  const isElite = c.categoryName?.toLowerCase().includes('elite')
                  const isEssential = c.categoryName?.toLowerCase().includes('essential')

                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer hover:bg-slate-50/90 transition-colors group"
                      onClick={() => openEditModal(c)}
                      title="Click to view & edit course details"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`mini-avatar shrink-0 ${
                              isElite ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {isElite ? <Sparkles size={16} /> : <BookOpen size={16} />}
                          </div>
                          <div className="min-w-0">
                            <strong className="block font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {c.name}
                            </strong>
                            <small className="block text-gray-500 font-mono text-xs">{c.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {c.categoryName ? (
                          <CategoryBadge categoryName={c.categoryName} />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs font-medium">
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
                        <div className="text-sm font-bold text-gray-900 leading-tight">{money(courseTotal)}</div>
                        {gstRate > 0 && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {isInclusive ? (
                              <>
                                Base: {money(courseBase)}{' '}
                                <span className="text-emerald-600 font-medium">({money(courseGst)} GST incl.)</span>
                              </>
                            ) : (
                              <>
                                Base: {money(c.fee)} <span className="text-gray-600">+{money(courseGst)}</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="panel-header flex items-center justify-between">
          <span>
            {totalCount} courses · Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>
          <div className="flex gap-4">
            <Link
              aria-disabled={page <= 1}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              href={`/courses?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
                sort,
                direction,
                page: String(Math.max(1, page - 1)),
                pageSize: String(pageSize),
              })}`}
            >
              Previous
            </Link>
            <Link
              aria-disabled={page >= Math.ceil(totalCount / pageSize)}
              className={page >= Math.ceil(totalCount / pageSize) ? 'pointer-events-none opacity-50' : ''}
              href={`/courses?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
                sort,
                direction,
                page: String(page + 1),
                pageSize: String(pageSize),
              })}`}
            >
              Next
            </Link>
          </div>
        </div>

        {/* Add / Edit Course Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h2>
                    {editingCourse?.categoryName && <CategoryBadge categoryName={editingCourse.categoryName} />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editingCourse
                      ? `Modify curriculum pricing, duration tier, and course settings for ${editingCourse.name}.`
                      : 'Configure curriculum tuition fee, GST pricing mode, duration tier, and details.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingCourse && (
                    <Link
                      href={`/courses/${encodeURIComponent(editingCourse.id)}/materials`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      title="Manage course materials and syllabus"
                    >
                      <BookOpen size={13} />
                      Materials
                      <ArrowUpRight size={12} />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
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
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Course Category Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="course-category-select" className="block text-sm font-medium text-gray-700">
                      Category Tier
                    </label>
                    {canManageCategories && (
                      <Link
                        href="/settings/course-categories"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                        target="_blank"
                      >
                        Manage Categories <ArrowUpRight size={11} />
                      </Link>
                    )}
                  </div>
                  <select
                    id="course-category-select"
                    aria-label="Category Tier"
                    value={categoryId}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.duration})
                      </option>
                    ))}
                    <option value="none">No Category (Custom Duration)</option>
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Selecting a category auto-fills the duration below (e.g. Essential → 6 weeks, Elite → 12 weeks).
                  </p>
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
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            !gstInclusive ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {!gstInclusive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 leading-tight">+GST added on top of fee</span>
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
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            gstInclusive ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                          }`}
                        >
                          {gstInclusive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 leading-tight">Fee already contains GST</span>
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
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      {gstInclusive ? 'All-inclusive tuition fee' : 'Base tuition fee before GST'}
                    </span>
                  </div>

                  <div>
                    <label htmlFor="course-duration-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="course-duration-select"
                      aria-label="Course Duration"
                      required
                      value={duration}
                      onChange={(e) => {
                        const newDur = e.target.value
                        setDuration(newDur)
                        const matchingCat = categories.find(
                          (c) => c.duration.trim().toLowerCase() === newDur.trim().toLowerCase(),
                        )
                        if (matchingCat) {
                          setCategoryId(matchingCat.id)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Select Duration --</option>
                      {availableDurations.map((item) => (
                        <option key={item.duration} value={item.duration}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">Configured from category tiers</span>
                  </div>
                </div>

                {/* Live Fee + GST Preview Box */}
                {enteredFee > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-gray-700">
                    <div className="font-semibold text-gray-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        Fee Breakdown
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            gstInclusive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {gstInclusive ? 'GST Inclusive' : 'GST Exclusive'}
                        </span>
                      </span>
                      <span className="text-slate-500 font-normal">
                        {gstRate > 0 ? `GST @ ${gstRate}%` : 'GST Not Applicable'}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Base Tuition (Taxable Amount):</span>
                      <strong className="text-gray-900">{money(modalBase)}</strong>
                    </div>
                    {gstRate > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>GST Amount:</span>
                        <strong className="text-gray-900">{money(modalGst)}</strong>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-gray-900 text-sm">
                      <span>Total Invoice Amount:</span>
                      <span className="text-blue-700">{money(modalTotal)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Short summary of technologies covered..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div>
                    {editingCourse && canDelete && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openSecurityDeleteModal(editingCourse)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs px-3 py-1.5"
                        disabled={submitting}
                      >
                        <Trash2 size={14} className="mr-1.5" />
                        Delete Course
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security Deletion Modal with Course Name Confirmation */}
        {deleteConfirmOpen && deleteConfirmCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl border border-red-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="bg-red-50/70 border-b border-red-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Delete Course</h3>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-red-600">
                      Destructive & Cascading Action
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeSecurityDeleteModal}
                  disabled={deleting}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs space-y-2 text-amber-900">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                    <span>Important Data Archival & Impact Warning</span>
                  </div>
                  <p className="leading-relaxed">
                    Deleting <strong className="text-gray-900 font-semibold">{deleteConfirmCourse.name}</strong> will
                    also cascade:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800/90 leading-normal">
                    <li>
                      Disassociates or removes all linked <strong>course materials</strong> and uploaded files.
                    </li>
                    <li>
                      Unlinks <strong>attendance records</strong>, session progress, and trainer allocations.
                    </li>
                    <li>
                      Removes linked <strong>assessment tests</strong> and student performance evaluations.
                    </li>
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    To confirm deletion, please type the course name:
                  </label>
                  <div className="mb-2 p-2 bg-slate-100 border border-slate-200 rounded-md font-mono text-xs font-semibold text-gray-800 select-all text-center">
                    {deleteConfirmCourse.name}
                  </div>
                  <input
                    type="text"
                    value={deleteInputName}
                    onChange={(e) => {
                      setDeleteInputName(e.target.value)
                      if (deleteError) setDeleteError('')
                    }}
                    placeholder="Type the exact course name here"
                    disabled={deleting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                    autoFocus
                  />
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    {deleteInputName.trim().length === 0 ? (
                      <span className="text-gray-400">Course name required to proceed</span>
                    ) : isDeleteNameMatched ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={13} /> Name matched. You may proceed.
                      </span>
                    ) : (
                      <span className="text-amber-600">Course name does not match yet</span>
                    )}
                  </div>
                </div>

                {deleteError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={closeSecurityDeleteModal} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={!isDeleteNameMatched || deleting}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting & Archiving...' : 'Permanently Delete Course'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
