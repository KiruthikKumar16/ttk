'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, FileText, Search, Sparkles, FolderOpen, ArrowRight, X } from 'lucide-react'
import type { CourseCategory } from '@/lib/types'
import { CategoryBadge, getCategoryBadgeStyle } from '@/components/CategoryBadge'

export interface MaterialCourseItem {
  id: string
  name: string
  duration: string
  categoryId?: string | null
  categoryName?: string | null
  materialsCount: number
}

export function MaterialsDirectory({
  courses,
  categories,
}: {
  courses: MaterialCourseItem[]
  categories: CourseCategory[]
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'uncategorized'
            ? !c.categoryId
            : c.categoryId === selectedCategory
      const matchesSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.duration.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [courses, selectedCategory, search])

  return (
    <div className="space-y-6">
      {/* Category Tabs & Search Bar */}
      <div className="p-3 rounded-[22px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[var(--panel)]">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'text-white shadow-sm'
                : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
            style={{
              background:
                selectedCategory === 'all'
                  ? 'linear-gradient(135deg, var(--g1), var(--g1b))'
                  : 'transparent',
            }}
          >
            All Courses ({courses.length})
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const count = courses.filter((c) => c.categoryId === cat.id).length

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--text)]'
                }`}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--g1), var(--g1b))'
                    : 'transparent',
                }}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--card)] text-[var(--mute)] border border-[var(--border)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Filter */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-9 pr-8 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] bg-[var(--card)] placeholder:text-[var(--mute)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          return (
            <Link
              key={course.id}
              href={`/courses/${encodeURIComponent(course.id)}/materials`}
              className="rounded-[22px] bg-[var(--card)] border border-[var(--border)] p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:border-[var(--g1)] transition-all cursor-pointer group flex flex-col justify-between"
              style={{
                textDecoration: 'none',
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                      getCategoryBadgeStyle(course.categoryName).bg
                    }`}
                  >
                    {course.categoryName?.toLowerCase().includes('internship') ? (
                      <FolderOpen size={18} />
                    ) : course.categoryName?.toLowerCase().includes('elite') ? (
                      <Sparkles size={18} />
                    ) : (
                      <BookOpen size={18} />
                    )}
                  </div>
                  {course.categoryName && <CategoryBadge categoryName={course.categoryName} />}
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-[var(--text-heading)] group-hover:text-[var(--g1)] transition-colors text-base line-clamp-1">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-[var(--mute)] mt-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={12} className="text-[var(--mute)]" />
                      {course.duration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-[var(--g1)]">
                      <FileText size={12} />
                      {course.materialsCount} {course.materialsCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--g1)]">
                <span>Access study resources</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <FolderOpen size={36} className="mx-auto text-gray-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">No courses match your filter</h3>
          <p className="text-xs text-gray-500 mt-1">Try switching category tabs or clearing your search term.</p>
        </div>
      )}
    </div>
  )
}
