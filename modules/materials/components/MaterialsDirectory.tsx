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
    <div className="space-y-5">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Courses ({courses.length})
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const count = courses.filter((c) => c.categoryId === cat.id).length
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
                  : 'bg-blue-100 text-blue-800'

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? activeBg
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : badgeBg
                  }`}
                >
                  {cat.duration} ({count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Filter */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
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
              className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      getCategoryBadgeStyle(course.categoryName).bg
                    }`}
                  >
                    {course.categoryName?.toLowerCase().includes('internship') ? (
                      <FolderOpen size={20} />
                    ) : course.categoryName?.toLowerCase().includes('elite') ? (
                      <Sparkles size={20} />
                    ) : (
                      <BookOpen size={20} />
                    )}
                  </div>
                  {course.categoryName && (
                    <CategoryBadge categoryName={course.categoryName} />
                  )}
                </div>

                <div className="mt-3.5">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-gray-400" />
                      {course.duration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <FileText size={13} className="text-slate-400" />
                      {course.materialsCount} {course.materialsCount === 1 ? 'resource' : 'resources'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-blue-600 group-hover:text-blue-700">
                <span>Access curriculum materials</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
