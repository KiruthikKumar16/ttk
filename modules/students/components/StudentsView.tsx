'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Student, Course, CourseCategory } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { CategoryBadge } from '@/components/CategoryBadge'

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
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryId)
  const [courseFilter, setCourseFilter] = useState(selectedCourse)

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

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACADEMY RECORDS</p>
          <h1>Students</h1>
          <p className="subcopy">Manage enrollment, fees, and student records.</p>
        </div>
        {canCreate && (
          <Link href="/students/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>Add student</span>
          </Link>
        )}
      </div>

      <section className="panel">
        {/* Search & Cascading Filter Header */}
        <div className="panel-header flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, or register ID..."
                className="w-full pl-9 pr-8 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
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
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer truncate"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap">
            Total Enrolled: <strong className="text-slate-800">{totalCount}</strong>
          </div>
        </div>

        <div className="data-wrap">
          <table>
            <thead>
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
            </thead>
            <tbody>
              {students.map((s) => {
                const categoryName = courseCategoryMap.get(s.course.trim().toLowerCase())

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
                        <div className="mini-avatar">
                          {s.name
                            .split(' ')
                            .map((x) => x[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'ST'}
                        </div>
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
