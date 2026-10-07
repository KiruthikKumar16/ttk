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
      <div className="panel p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all' ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
            style={
              selectedCategory === 'all'
                ? {
                    background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                  }
                : {}
            }
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                style={
                  isSelected
                    ? {
                        background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                      }
                    : {}
                }
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-8 pr-7 py-1.5 border border-slate-200/80 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white/90"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="stat-card flex flex-col justify-between group cursor-pointer"
              style={{
                textDecoration: 'none',
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
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
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base line-clamp-1">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Clock size={12} className="text-slate-400" />
                      {course.duration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-indigo-600">
                      <FileText size={12} />
                      {course.materialsCount} {course.materialsCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
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
