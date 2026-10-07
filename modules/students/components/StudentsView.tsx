'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronLeft, ChevronRight, X, Filter, LayoutGrid, List as ListIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Student, Course, CourseCategory, Role } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { CategoryBadge } from '@/components/CategoryBadge'
import { Avatar } from '@/components/ui/Avatar'

export function StudentsView({
  students,
  categories = [],
  courses = [],
  selectedCategoryId = '',
  selectedCourse = '',
  totalCount,
  page,
  pageSize,
  search: initialSearch = '',
  canCreate = true,
  role = 'admin',
}: {
  students: Student[]
  categories?: CourseCategory[]
  courses?: Course[]
  selectedCategoryId?: string
  selectedCourse?: string
  totalCount: number
  page: number
  pageSize: number
  search?: string
  canCreate?: boolean
  role?: Role
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryId)
  const [courseFilter, setCourseFilter] = useState(selectedCourse)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const fromIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const toIndex = Math.min(page * pageSize, totalCount)

  // Filter courses in the dropdown according to the selected category (cascading)
  const filteredCourseOptions = useMemo(() => {
    if (!categoryFilter) return courses
    return courses.filter((c) => c.categoryId === categoryFilter)
  }, [courses, categoryFilter])

  // Map course names to category names for fast badge rendering in table rows
  const courseCategoryMap = useMemo(() => {
    const map = new Map<string, string>()
    courses.forEach((c) => {
      if (c.categoryName) {
        map.set(c.name.trim().toLowerCase(), c.categoryName)
      }
    })
    return map
  }, [courses])

  const applyFilters = (filters: { search?: string; categoryId?: string; course?: string; page?: number }) => {
    const params = new URLSearchParams()
    const s = filters.search !== undefined ? filters.search.trim() : searchTerm.trim()
    const cat = filters.categoryId !== undefined ? filters.categoryId : categoryFilter
    const crs = filters.course !== undefined ? filters.course : courseFilter

    if (s) params.set('search', s)
    if (cat) params.set('categoryId', cat)
    if (crs) params.set('course', crs)
    params.set('page', String(filters.page ?? 1))
    params.set('pageSize', String(pageSize))
    router.push(`/students?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search: searchTerm, page: 1 })
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    applyFilters({ search: '', page: 1 })
  }

  const handleCategoryChange = (newCatId: string) => {
    setCategoryFilter(newCatId)
    let newCourse = courseFilter
    if (newCatId) {
      const selectedCourseObj = courses.find((c) => c.name.trim().toLowerCase() === courseFilter.trim().toLowerCase())
      if (selectedCourseObj && selectedCourseObj.categoryId !== newCatId) {
        newCourse = ''
        setCourseFilter('')
      }
    }
    applyFilters({ categoryId: newCatId, course: newCourse, page: 1 })
  }

  const handleCourseChange = (newCourse: string) => {
    setCourseFilter(newCourse)
    let newCat = categoryFilter
    if (newCourse && !newCat) {
      const courseObj = courses.find((c) => c.name.trim().toLowerCase() === newCourse.trim().toLowerCase())
      if (courseObj?.categoryId) {
        newCat = courseObj.categoryId
        setCategoryFilter(newCat)
      }
    }
    applyFilters({ categoryId: newCat, course: newCourse, page: 1 })
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setCourseFilter('')
    router.push(`/students?page=1&pageSize=${pageSize}`)
  }

  const handlePageChange = (newPage: number) => {
    applyFilters({ page: newPage })
  }

  const hasActiveFilters = Boolean(searchTerm || categoryFilter || courseFilter)
  const isStaff = role === 'staff'

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
            {isStaff ? 'ACADEMY ROSTER' : 'ACADEMY RECORDS'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-heading)]">Students</h1>
          <p className="text-sm text-[var(--mute)] mt-1">
            {isStaff
              ? 'Active student roster, batch schedules, contact records, and academic progress.'
              : 'Manage enrollment, fees, and student records.'}
          </p>
        </div>
        {canCreate && (
          <Link href="/students/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} />
            <span>Add student</span>
          </Link>
        )}
      </div>

      <section className="rounded-[26px] bg-[var(--panel)] border border-[var(--border)] p-4 sm:p-6 mb-8">
        {/* Search & Cascading Filter Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, or register ID..."
                className="w-full pl-9 pr-8 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors bg-[var(--card)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Category Filter Dropdown */}
            <div className="min-w-[150px]">
              <label htmlFor="category-filter" className="sr-only">
                Course Category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.duration})
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Course Filter Dropdown */}
            <div className="min-w-[170px] max-w-xs">
              <label htmlFor="course-filter" className="sr-only">
                Specific Course
              </label>
              <select
                id="course-filter"
                value={courseFilter}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3.5 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors cursor-pointer truncate"
              >
                <option value="">{categoryFilter ? 'All Courses in Category' : 'All Courses'}</option>
                {filteredCourseOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--mute)] bg-[var(--panel)] hover:text-[var(--text)] transition-colors cursor-pointer border border-[var(--border)]"
                title="Reset all filters"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-xs text-[var(--mute)] whitespace-nowrap font-medium">
              Total Enrolled: <strong className="text-[var(--text-heading)]">{totalCount}</strong>
            </div>

            {/* View Mode Toggle: Table List vs Grid Cards */}
            <div className="flex items-center bg-[var(--card)] p-1 rounded-full border border-[var(--border)] shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-[var(--g1)] text-white shadow-xs'
                    : 'text-[var(--mute)] hover:text-[var(--text)]'
                }`}
                title="Table List View"
                aria-label="Table List View"
              >
                <ListIcon size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-[var(--g1)] text-white shadow-xs'
                    : 'text-[var(--mute)] hover:text-[var(--text)]'
                }`}
                title="Cards Grid View"
                aria-label="Cards Grid View"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="data-wrap">
            <table>
              <thead>
                {isStaff ? (
                  <tr>
                    <th>Register ID</th>
                    <th>Student</th>
                    <th>Course & Curriculum</th>
                    <th>Batch start</th>
                    <th>Contact & Location</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th className="align-right">Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Register ID</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Batch start</th>
                    <th className="align-right">Total fees</th>
                    <th className="align-right">Balance</th>
                    <th>Source</th>
                    <th>Status</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {students.map((s) => {
                  const categoryName = courseCategoryMap.get(s.course.trim().toLowerCase())

                  if (isStaff) {
                    return (
                      <tr
                        key={s.registerId}
                        className="clickable-row hover:bg-slate-50/80 transition-colors"
                        onClick={() => router.push(`/students/${s.registerId}`)}
                      >
                        <td className="mono font-mono font-medium text-slate-500">
                          <Link
                            href={`/students/${s.registerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-indigo-600 hover:underline"
                          >
                            TAI-{s.registerId}
                          </Link>
                        </td>
                        <td>
                          <Link
                            href={`/students/${s.registerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="student-cell flex items-center gap-2.5"
                          >
                            <Avatar name={s.name} size="sm" />
                            <div>
                              <strong className="block text-sm font-semibold text-slate-900 hover:text-indigo-600">
                                {s.name}
                              </strong>
                              <small className="block text-xs text-slate-500">{s.phone}</small>
                            </div>
                          </Link>
                        </td>
                        <td className="text-sm text-slate-700">
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-medium text-slate-900 leading-snug">{s.course}</span>
                            {categoryName && <CategoryBadge categoryName={categoryName} />}
                          </div>
                        </td>
                        <td className="text-sm text-slate-600 font-mono">{s.batch}</td>
                        <td className="text-xs text-slate-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate max-w-[170px] text-slate-700 font-medium">{s.email || '—'}</span>
                            <span className="text-slate-400">
                              {[s.area, s.city, s.state].filter(Boolean).join(', ') || 'Tamil Nadu, India'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1 max-w-[190px]">
                            {s.knowledgeTags && s.knowledgeTags.length > 0 ? (
                              s.knowledgeTags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                            {s.knowledgeTags && s.knowledgeTags.length > 2 && (
                              <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                                +{s.knowledgeTags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Status status={s.status} />
                        </td>
                        <td className="align-right">
                          <Link
                            href={`/students/${s.registerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            <span>Profile</span>
                            <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={s.registerId}
                      className="clickable-row hover:bg-slate-50/80 transition-colors"
                      onClick={() => router.push(`/students/${s.registerId}`)}
                    >
                      <td className="mono font-mono font-medium text-slate-500">
                        <Link
                          href={`/students/${s.registerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-indigo-600 hover:underline"
                        >
                          TAI-{s.registerId}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/students/${s.registerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="student-cell flex items-center gap-2.5"
                        >
                          <Avatar name={s.name} size="sm" />
                          <div>
                            <strong className="block text-sm font-semibold text-slate-900 hover:text-indigo-600">
                              {s.name}
                            </strong>
                            <small className="block text-xs text-slate-400">{s.phone}</small>
                          </div>
                        </Link>
                      </td>
                      <td className="text-sm text-slate-700">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-slate-900 leading-snug">{s.course}</span>
                          {categoryName && <CategoryBadge categoryName={categoryName} />}
                        </div>
                      </td>
                      <td className="text-sm text-slate-600 font-mono">{s.batch}</td>
                      <td className="align-right text-sm font-medium text-slate-900">{money(s.total)}</td>
                      <td className="align-right amount text-sm font-bold text-slate-900">
                        {money(Math.max(0, s.total - s.paid))}
                      </td>
                      <td className="text-xs text-slate-500">{s.studentSource || '-'}</td>
                      <td>
                        <Status status={s.status} />
                      </td>
                    </tr>
                  )
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      {hasActiveFilters
                        ? 'No students found matching your search or category/course filter criteria.'
                        : 'No students registered yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Students Grid View */
          <div className="p-4">
            {students.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <p className="font-medium text-slate-700">No students found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {hasActiveFilters
                    ? 'No students match your search or filter criteria. Try resetting filters.'
                    : 'No students registered yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((s) => {
                  const categoryName = courseCategoryMap.get(s.course.trim().toLowerCase())
                  const balance = Math.max(0, s.total - s.paid)

                  return (
                    <div
                      key={s.registerId}
                      onClick={() => router.push(`/students/${s.registerId}`)}
                      className="bg-[var(--card)] border border-[var(--border)] rounded-[22px] p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:border-[var(--g1)] transition-all cursor-pointer group flex flex-col justify-between"
                      title={`View student ${s.name}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={s.name} size="md" />
                            <div className="min-w-0">
                              <strong className="block text-sm font-bold text-[var(--text-heading)] group-hover:text-[var(--g1)] transition-colors truncate">
                                {s.name}
                              </strong>
                              <span className="block text-xs font-mono text-[var(--mute)]">TAI-{s.registerId}</span>
                            </div>
                          </div>
                          <Status status={s.status} />
                        </div>

                        <div className="mb-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <span className="text-slate-900 font-semibold block truncate">{s.course}</span>
                            <span className="text-slate-500 text-[11px]">Batch: {s.batch}</span>
                          </div>
                          {categoryName && <CategoryBadge categoryName={categoryName} />}
                        </div>

                        {!isStaff ? (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-3 space-y-1 text-xs">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Total Fees:</span>
                              <strong className="text-slate-900">{money(s.total)}</strong>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Balance:</span>
                              <strong
                                className={balance > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}
                              >
                                {balance === 0 ? 'Fully Paid' : money(balance)}
                              </strong>
                            </div>
                            {(s.studentSource || (s as any).leadSource) && (
                              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                <span>Source:</span>
                                <span className="font-medium text-slate-700">
                                  {s.studentSource || (s as any).leadSource}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mb-3 space-y-1.5 text-xs text-slate-600">
                            <div className="truncate">
                              <span className="text-slate-500 block text-[11px]">Email:</span>
                              <span className="font-medium text-slate-800 truncate block">{s.email || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Location:</span>
                              <span className="text-slate-700 text-xs truncate block">
                                {[s.area, s.city, s.state].filter(Boolean).join(', ') || 'Tamil Nadu, India'}
                              </span>
                            </div>
                            {s.knowledgeTags && s.knowledgeTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {s.knowledgeTags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {s.knowledgeTags.length > 3 && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    +{s.knowledgeTags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="text-slate-600 text-[11px]">Phone: {s.phone || '—'}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700">
                          Profile <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Table summary & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
          <div className="table-summary border-0 p-0">
            Showing{' '}
            <strong>
              {fromIndex}-{toIndex}
            </strong>{' '}
            of <strong>{totalCount}</strong> students
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="text-slate-600 hover:text-slate-900 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="text-slate-600 hover:text-slate-900 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
