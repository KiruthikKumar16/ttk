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
  ChevronDown,
  Trash2,
  Plus,
  Search,
  X,
  Layers,
  Sparkles,
  ShieldAlert,
  LayoutGrid,
  List as ListIcon,
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)] mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--mute)]">ACADEMY CURRICULUM</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Manage Courses</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Configure academy curriculum programs, duration tiers, tuition fees, and GST pricing.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {canManageCategories && (
            <Link
              href="/settings/course-categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--panel)] text-xs font-bold text-[var(--text)] hover:bg-[var(--card)] transition-colors"
            >
              <Layers size={14} className="text-[var(--mute)]" />
              <span>Configure Categories</span>
            </Link>
          )}
          {canCreate && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
            >
              <Plus size={14} />
              <span>Add Course</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-1.5 rounded-full bg-[var(--panel)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={makeCategoryTabUrl(undefined)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              !selectedCategoryId
                ? 'text-white shadow-xs'
                : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={
              !selectedCategoryId
                ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }
                : {}
            }
          >
            All Courses
          </Link>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id

            return (
              <Link
                key={cat.id}
                href={makeCategoryTabUrl(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'text-[var(--mute)] hover:text-[var(--text)]'
                }`}
                style={
                  isSelected
                    ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }
                    : {}
                }
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--card)] text-[var(--mute)]'
                  }`}
                >
                  {cat.duration}
                </span>
              </Link>
            )
          })}
          <Link
            href={makeCategoryTabUrl('uncategorized')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategoryId === 'uncategorized'
                ? 'text-white shadow-xs'
                : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={
              selectedCategoryId === 'uncategorized'
                ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }
                : {}
            }
          >
            Uncategorized
          </Link>
        </div>

        <div className="text-xs text-[var(--mute)] font-semibold px-3">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>
      </div>

      <section className="bg-[var(--card)] rounded-[22px] border border-[var(--border)] shadow-xs overflow-hidden mb-6">
        <div className="p-5 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {selectedCategoryId
                ? selectedCategoryId === 'uncategorized'
                  ? 'Uncategorized Courses'
                  : `${categories.find((c) => c.id === selectedCategoryId)?.name || 'Filtered'} Courses (${filteredCourses.length})`
                : `Course Catalog (${filteredCourses.length})`}
            </h2>
            <p className="text-xs text-[var(--mute)] mt-0.5">
              Academy curriculum with GST Inclusive and Exclusive pricing (
              {gstRate > 0 ? `${gstRate}% GST applicable` : 'GST disabled'})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <form action="/courses" method="get" className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                />
                <input
                  name="search"
                  aria-label="Search courses"
                  type="text"
                  placeholder="Search courses..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-48 sm:w-60 pl-9 pr-8 py-2 rounded-full border border-[var(--border)] bg-[var(--panel)] text-xs font-medium text-[var(--text)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)] shadow-2xs"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      const params = new URLSearchParams()
                      if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
                      if (sort) params.set('sort', sort)
                      const qs = params.toString()
                      router.push('/courses' + (qs ? `?${qs}` : ''))
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)] p-0.5 cursor-pointer"
                    aria-label="Clear search input"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {selectedCategoryId && <input type="hidden" name="categoryId" value={selectedCategoryId} />}
              <input type="hidden" name="pageSize" value={pageSize} />
              <input type="hidden" name="direction" value={direction} />

              <div className="relative">
                <label className="sr-only" htmlFor="course-sort">
                  Sort courses by
                </label>
                <select
                  id="course-sort"
                  name="sort"
                  defaultValue={sort}
                  onChange={(e) => {
                    const newSort = e.target.value
                    const params = new URLSearchParams()
                    if (query) params.set('search', query)
                    if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
                    params.set('sort', newSort)
                    params.set('pageSize', String(pageSize))
                    router.push(`/courses?${params.toString()}`)
                  }}
                  className="py-2 pl-3.5 pr-8 rounded-full border border-[var(--border)] bg-[var(--panel)] text-xs font-semibold text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)] shadow-2xs appearance-none cursor-pointer"
                >
                  <option value="name">Name</option>
                  <option value="fee">Fee</option>
                  <option value="duration">Duration</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
                />
              </div>

              <button type="submit" className="sr-only">
                Search
              </button>
            </form>

            {/* View Mode Toggle: Table List vs Grid Cards */}
            <div className="flex items-center bg-[var(--panel)] p-1 rounded-full border border-[var(--border)] shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'text-white shadow-2xs'
                    : 'text-[var(--mute)] hover:text-[var(--text)]'
                }`}
                style={
                  viewMode === 'table'
                    ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }
                    : {}
                }
                title="Table List View"
                aria-label="Table List View"
              >
                <ListIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'text-white shadow-2xs'
                    : 'text-[var(--mute)] hover:text-[var(--text)]'
                }`}
                style={
                  viewMode === 'grid'
                    ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }
                    : {}
                }
                title="Course Cards Grid View"
                aria-label="Course Cards Grid View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto" role="region" aria-label="Course list" tabIndex={0}>
            <table className="w-full text-left text-xs" style={{ whiteSpace: 'normal' }}>
              <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4" style={{ width: '28%' }}>Course</th>
                  <th className="py-3.5 px-4" style={{ width: '15%' }}>Category</th>
                  <th className="py-3.5 px-4" style={{ width: '12%' }}>Duration</th>
                  <th className="py-3.5 px-4" style={{ width: '13%' }}>Tax Mode</th>
                  <th className="py-3.5 px-4" style={{ width: '20%' }}>Description</th>
                  <th className="py-3.5 px-4 text-right" style={{ width: '12%', whiteSpace: 'nowrap' }}>
                    Fee {gstRate > 0 ? `(${gstRate}% GST)` : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[var(--mute)]">
                      <BookOpen size={32} className="mx-auto text-[var(--mute)] mb-2" />
                      <p className="font-bold text-[var(--text)]">No courses found matching your criteria.</p>
                      <p className="text-xs text-[var(--mute)] mt-1">Try switching categories or clearing search filters.</p>
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

                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer hover:bg-[var(--panel)] transition-colors group"
                        onClick={() => openEditModal(c)}
                        title="Click to view & edit course details"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{
                                background: isElite ? 'var(--panel)' : 'var(--panel)',
                                color: 'var(--g1)',
                              }}
                            >
                              {isElite ? <Sparkles size={16} /> : <BookOpen size={16} />}
                            </div>
                            <div className="min-w-0">
                              <strong className="block font-bold text-[var(--text)] group-hover:text-[var(--g1)] transition-colors leading-snug">
                                {c.name}
                              </strong>
                              <small className="block text-[var(--mute)] font-mono text-xs">{c.id}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {c.categoryName ? (
                            <CategoryBadge categoryName={c.categoryName} />
                          ) : (
                            <span className="text-xs text-[var(--mute)] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4" style={{ whiteSpace: 'nowrap' }}>
                          <div className="flex items-center gap-1.5 text-[var(--text)] text-xs font-semibold">
                            <Clock size={13} className="text-[var(--mute)] shrink-0" />
                            <span>{c.duration}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isInclusive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#1b7a4b]">
                              GST Inclusive
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-[#a8710f]">
                              GST Exclusive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-[var(--mute)] text-xs line-clamp-2 leading-relaxed" title={c.description}>
                            {c.description || '—'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right" style={{ whiteSpace: 'nowrap' }}>
                          <div className="text-sm font-bold text-[var(--text)] leading-tight">{money(courseTotal)}</div>
                          {gstRate > 0 && (
                            <div className="text-[11px] text-[var(--mute)] mt-0.5">
                              {isInclusive ? (
                                <>
                                  Base: {money(courseBase)}{' '}
                                  <span className="text-[#1b7a4b] font-bold">({money(courseGst)} GST incl.)</span>
                                </>
                              ) : (
                                <>
                                  Base: {money(c.fee)} <span>+{money(courseGst)}</span>
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
        ) : (
          /* Courses Grid View */
          <div className="p-5" role="region" aria-label="Course grid" tabIndex={0}>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-[var(--mute)]">
                <BookOpen size={32} className="mx-auto text-[var(--mute)] mb-2" />
                <p className="font-bold text-[var(--text)]">No courses found matching your criteria.</p>
                <p className="text-xs text-[var(--mute)] mt-1">Try switching categories or clearing search filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((c) => {
                  const isInclusive = Boolean(c.gstInclusive)
                  const courseBreakdown = calculateGstForRupees(c.fee, gstRate, isInclusive)
                  const courseGst = courseBreakdown.gstAmount
                  const courseTotal = courseBreakdown.totalAmount
                  const isElite = c.categoryName?.toLowerCase().includes('elite')

                  return (
                    <div
                      key={c.id}
                      onClick={() => openEditModal(c)}
                      className="bg-[var(--card)] border border-[var(--border)] rounded-[22px] p-5 shadow-xs hover:border-[var(--g1)] transition-all cursor-pointer group flex flex-col justify-between"
                      title="Click to view & edit course details"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{
                                background: 'var(--panel)',
                                color: 'var(--g1)',
                              }}
                            >
                              {isElite ? <Sparkles size={16} /> : <BookOpen size={16} />}
                            </div>
                            <div className="min-w-0">
                              <strong className="block font-bold text-[var(--text)] group-hover:text-[var(--g1)] transition-colors leading-snug truncate">
                                {c.name}
                              </strong>
                              <small className="block text-[var(--mute)] font-mono text-xs">{c.id}</small>
                            </div>
                          </div>
                          {isInclusive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#1b7a4b] shrink-0">
                              GST Incl.
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-[#a8710f] shrink-0">
                              GST Excl.
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs mb-3">
                          <div className="flex items-center gap-1.5 text-[var(--text)] font-semibold">
                            <Clock size={13} className="text-[var(--mute)] shrink-0" />
                            <span>{c.duration}</span>
                          </div>
                          {c.categoryName ? (
                            <CategoryBadge categoryName={c.categoryName} />
                          ) : (
                            <span className="text-xs text-[var(--mute)] italic">Unassigned</span>
                          )}
                        </div>

                        <p className="text-[var(--mute)] text-xs line-clamp-2 leading-relaxed mb-3" title={c.description}>
                          {c.description || 'No course description provided.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[var(--border)] flex items-end justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mute)] block">
                            Fee {gstRate > 0 ? `(${gstRate}% GST)` : ''}
                          </span>
                          <div className="text-base font-extrabold text-[var(--text)] leading-tight">{money(courseTotal)}</div>
                          {gstRate > 0 && (
                            <div className="text-[11px] text-[var(--mute)] mt-0.5">
                              {isInclusive ? (
                                <span className="text-[#1b7a4b] font-semibold">Incl. {money(courseGst)} GST</span>
                              ) : (
                                <span>+{money(courseGst)} GST</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/courses/${encodeURIComponent(c.id)}/materials`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[var(--text)] bg-[var(--panel)] hover:bg-[var(--card)] border border-[var(--border)] rounded-full transition-colors"
                            title="Manage course materials and syllabus"
                          >
                            <BookOpen size={12} />
                            <span>Materials</span>
                          </Link>
                          {canUpdate && (
                            <span className="text-xs font-bold group-hover:underline" style={{ color: 'var(--g1)' }}>
                              Edit
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-[var(--border)] bg-[var(--panel)] flex items-center justify-between text-xs text-[var(--mute)]">
          <span>
            {totalCount} courses · Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>
          <div className="flex items-center gap-2">
            <Link
              aria-disabled={page <= 1}
              className={`px-4 py-1.5 rounded-full font-bold border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-colors ${
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-[var(--panel)]'
              }`}
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
              className={`px-4 py-1.5 rounded-full font-bold border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-colors ${
                page >= Math.ceil(totalCount / pageSize) ? 'pointer-events-none opacity-40' : 'hover:bg-[var(--panel)]'
              }`}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--card)] rounded-[26px] shadow-2xl border border-[var(--border)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--text)]">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h2>
                    {editingCourse?.categoryName && <CategoryBadge categoryName={editingCourse.categoryName} />}
                  </div>
                  <p className="text-xs text-[var(--mute)] mt-0.5">
                    {editingCourse
                      ? `Modify curriculum pricing, duration tier, and course settings for ${editingCourse.name}.`
                      : 'Configure curriculum tuition fee, GST pricing mode, duration tier, and details.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingCourse && (
                    <Link
                      href={`/courses/${encodeURIComponent(editingCourse.id)}/materials`}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--card)] transition-colors"
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
                    className="text-[var(--mute)] hover:text-[var(--text)] p-1.5 rounded-full hover:bg-[var(--panel)] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-[#b53c37] flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Course Name <span className="text-[#b53c37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Development"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--panel)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
                  />
                </div>

                {/* Course Category Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="course-category-select" className="block text-xs font-bold text-[var(--text)]">
                      Category Tier
                    </label>
                    {canManageCategories && (
                      <Link
                        href="/settings/course-categories"
                        className="text-xs font-bold hover:underline flex items-center gap-1"
                        style={{ color: 'var(--g1)' }}
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
                    className="w-full px-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--panel)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.duration})
                      </option>
                    ))}
                    <option value="none">No Category (Custom Duration)</option>
                  </select>
                  <p className="text-[11px] text-[var(--mute)] mt-1">
                    Selecting a category auto-fills the duration below (e.g. Essential → 6 weeks, Elite → 12 weeks).
                  </p>
                </div>

                {/* GST Pricing Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                    GST Calculation Mode <span className="text-[#b53c37]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGstInclusive(false)}
                      className={`p-3 rounded-[16px] border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        !gstInclusive
                          ? 'border-[var(--g1)] bg-[var(--panel)] ring-1 ring-[var(--g1)]'
                          : 'border-[var(--border)] hover:border-[var(--mute)] bg-[var(--card)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text)]">Exclusive of GST</span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            !gstInclusive ? 'border-[var(--g1)] bg-[var(--g1)]' : 'border-[var(--border)]'
                          }`}
                        >
                          {!gstInclusive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--mute)] mt-1 leading-tight">+GST added on top of fee</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGstInclusive(true)}
                      className={`p-3 rounded-[16px] border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        gstInclusive
                          ? 'border-[var(--g1)] bg-[var(--panel)] ring-1 ring-[var(--g1)]'
                          : 'border-[var(--border)] hover:border-[var(--mute)] bg-[var(--card)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text)]">Inclusive of GST</span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            gstInclusive ? 'border-[var(--g1)] bg-[var(--g1)]' : 'border-[var(--border)]'
                          }`}
                        >
                          {gstInclusive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--mute)] mt-1 leading-tight">Fee already contains GST</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">
                      Course Fee (₹) <span className="text-[#b53c37]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 42000"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--panel)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
                    />
                    <span className="text-[11px] text-[var(--mute)] mt-0.5 block">
                      {gstInclusive ? 'All-inclusive tuition fee' : 'Base tuition fee before GST'}
                    </span>
                  </div>

                  <div>
                    <label htmlFor="course-duration-select" className="block text-xs font-bold text-[var(--text)] mb-1">
                      Duration <span className="text-[#b53c37]">*</span>
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
                      className="w-full px-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--panel)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
                    >
                      <option value="">-- Select Duration --</option>
                      {availableDurations.map((item) => (
                        <option key={item.duration} value={item.duration}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[var(--mute)] mt-0.5 block">Configured from category tiers</span>
                  </div>
                </div>

                {/* Live Fee + GST Preview Box */}
                {enteredFee > 0 && (
                  <div className="p-3.5 bg-[var(--panel)] border border-[var(--border)] rounded-[18px] text-xs space-y-1.5 text-[var(--text)]">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        Fee Breakdown
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gstInclusive ? 'bg-emerald-500/15 text-[#1b7a4b]' : 'bg-amber-500/15 text-[#a8710f]'
                          }`}
                        >
                          {gstInclusive ? 'GST Inclusive' : 'GST Exclusive'}
                        </span>
                      </span>
                      <span className="text-[var(--mute)] font-normal">
                        {gstRate > 0 ? `GST @ ${gstRate}%` : 'GST Not Applicable'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[var(--mute)]">
                      <span>Base Tuition (Taxable Amount):</span>
                      <strong className="text-[var(--text)]">{money(modalBase)}</strong>
                    </div>
                    {gstRate > 0 && (
                      <div className="flex justify-between text-[var(--mute)]">
                        <span>GST Amount:</span>
                        <strong className="text-[var(--text)]">{money(modalGst)}</strong>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-[var(--border)] flex justify-between font-bold text-sm">
                      <span>Total Invoice Amount:</span>
                      <span style={{ color: 'var(--g1)' }}>{money(modalTotal)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Short summary of technologies covered..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[18px] text-xs text-[var(--text)] bg-[var(--panel)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
                  <div>
                    {editingCourse && canDelete && (
                      <button
                        type="button"
                        onClick={() => openSecurityDeleteModal(editingCourse)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#b53c37] hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                        disabled={submitting}
                      >
                        <Trash2 size={14} />
                        Delete Course
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={submitting}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text)] bg-[var(--panel)] border border-[var(--border)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
                    >
                      {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security Deletion Modal with Course Name Confirmation */}
        {deleteConfirmOpen && deleteConfirmCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
            <div className="bg-[var(--card)] rounded-[26px] shadow-2xl border border-rose-500/20 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500/20 text-[#b53c37] flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">Delete Course</h3>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#b53c37]">
                      Destructive & Cascading Action
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeSecurityDeleteModal}
                  disabled={deleting}
                  className="text-[var(--mute)] hover:text-[var(--text)] p-1.5 rounded-full hover:bg-[var(--panel)] transition-colors cursor-pointer"
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
