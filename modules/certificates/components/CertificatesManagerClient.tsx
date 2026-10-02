'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Award,
  GraduationCap,
  ShieldCheck,
  QrCode,
  Search,
  LayoutGrid,
  List as ListIcon,
  ExternalLink,
  Eye,
  Calendar,
  BookOpen,
  Sparkles,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { CategoryBadge, getCategoryBadgeStyle } from '@/components/CategoryBadge'
import { CertificateTableRow, type CertificateRowItem } from './CertificateTableRow'
import type { CourseCategory } from '@/lib/types'

interface CertificatesManagerClientProps {
  certificates: (CertificateRowItem & { [key: string]: any })[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
  categoryId?: string
  course?: string
  courseCategoryMap: Record<string, string>
  categories: CourseCategory[]
}

export function CertificatesManagerClient({
  certificates,
  totalCount,
  page,
  pageSize,
  search: initialSearch,
  sort,
  direction,
  categoryId,
  course,
  courseCategoryMap,
  categories,
}: CertificatesManagerClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchInput, setSearchInput] = useState(initialSearch)

  // Compute stats
  const verifiableCount = useMemo(() => {
    return certificates.filter((c) => Boolean(c.verification_code)).length
  }, [certificates])

  const coursesWithCertificates = useMemo(() => {
    return new Set(certificates.map((c) => c.course_name.trim().toLowerCase())).size
  }, [certificates])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: totalCount }
    categories.forEach((cat) => {
      counts[cat.id] = 0
    })
    certificates.forEach((c) => {
      const catName = courseCategoryMap[c.course_name.trim().toLowerCase()]
      const cat = categories.find(
        (catItem) => catItem.name.trim().toLowerCase() === (catName || '').trim().toLowerCase(),
      )
      if (cat) {
        counts[cat.id] = (counts[cat.id] || 0) + 1
      }
    })
    return counts
  }, [certificates, categories, courseCategoryMap, totalCount])

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set('search', searchInput.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/certificates?${params.toString()}`)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.set('page', '1')
    router.push(`/certificates?${params.toString()}`)
  }

  // Handle Category Filter Click
  const handleCategoryFilter = (catId?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (catId) {
      params.set('categoryId', catId)
    } else {
      params.delete('categoryId')
    }
    params.set('page', '1')
    router.push(`/certificates?${params.toString()}`)
  }

  // Handle Sort Change
  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', newSort)
    params.set('page', '1')
    router.push(`/certificates?${params.toString()}`)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6">
      {/* Page Heading & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
              Verified Academic Credentials
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Certificates</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Official completion diplomas, verification QR records, and graduation credentials.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <GraduationCap size={15} className="text-gray-500" />
            <span>Eligible Students</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-200/60">
            <Award size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
              Total Certificates
            </span>
            <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
              {totalCount} <span className="text-xs text-gray-500 font-normal">Issued</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
              QR Verifiable Records
            </span>
            <div className="text-xl font-bold text-emerald-700 leading-tight mt-0.5">
              {verifiableCount} <span className="text-xs text-gray-500 font-normal">Protected</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-200/60">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
              Programs Represented
            </span>
            <div className="text-xl font-bold text-indigo-700 leading-tight mt-0.5">
              {coursesWithCertificates} <span className="text-xs text-gray-500 font-normal">Curricula</span>
            </div>
          </div>
        </div>
      </div>

      {/* Program Category Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-gray-200/80">
        <button
          type="button"
          onClick={() => handleCategoryFilter(undefined)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            !categoryId
              ? 'bg-gray-900 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <Layers size={14} className={!categoryId ? 'text-white' : 'text-gray-400'} />
          <span>All Programs</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${!categoryId ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {totalCount}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = categoryId === cat.id
          const isElite = cat.name.toLowerCase().includes('elite')
          const isEssential = cat.name.toLowerCase().includes('essential')
          const isInternship = cat.name.toLowerCase().includes('internship')

          const activeClass = isElite
            ? 'bg-purple-600 text-white shadow-xs'
            : isEssential
              ? 'bg-amber-600 text-white shadow-xs'
              : isInternship
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-blue-600 text-white shadow-xs'

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryFilter(cat.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? activeClass
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat.duration}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search, Sort, and View Mode Switcher Toolbar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search certificate ID, student name, or course..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <label htmlFor="certificates-sort-select" className="hidden sm:inline font-medium">
              Sort:
            </label>
            <select
              id="certificates-sort-select"
              aria-label="Sort certificates"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="issue_date">Issue Date</option>
              <option value="student_name">Student Name</option>
              <option value="certificate_id">Certificate ID</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid Cards vs Dense Table */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Diploma Showcase Cards"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Table List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {certificates.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
            <Award size={28} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No certificates found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            {searchInput
              ? `No certificate records match "${searchInput}". Try clearing search filters.`
              : 'No certificates have been issued under this curriculum tier yet.'}
          </p>
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-xs font-semibold text-amber-600 hover:underline"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Diploma Showcase Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => {
            const catName = courseCategoryMap[cert.course_name.trim().toLowerCase()]
            const certUrl = `/certificates/${encodeURIComponent(cert.certificate_id || cert.id)}`

            return (
              <div
                key={cert.id}
                onClick={() => router.push(certUrl)}
                className="bg-white border-2 border-amber-100/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-400 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                title={`Click to view & print certificate ${cert.certificate_id}`}
              >
                {/* Diploma Card Frame Header */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-amber-500/10 border-b border-amber-200/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs font-bold text-xs">
                      ★
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
                      {cert.certificate_id}
                    </span>
                  </div>
                  {catName ? (
                    <CategoryBadge categoryName={catName} />
                  ) : (
                    <span className="text-[10px] text-gray-600 uppercase font-semibold">Standard</span>
                  )}
                </div>

                {/* Diploma Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                      Candidate
                    </span>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-800 transition-colors mt-0.5 leading-snug">
                      {cert.student_name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1 font-medium">Student #{cert.student_register_id}</div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                        Course Curriculum
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 line-clamp-1">{cert.course_name}</p>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                      <Calendar size={13} className="text-gray-500" />
                      <span>{cert.issue_date}</span>
                    </div>

                    {cert.verification_code ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck size={12} /> QR Verifiable
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-600">Offline Record</span>
                    )}
                  </div>
                </div>

                {/* Diploma Card Footer Action */}
                <div className="px-5 py-3 bg-amber-50/50 border-t border-amber-100 flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-medium flex items-center gap-1 group-hover:underline">
                    <Eye size={13} /> View & Print Certificate
                  </span>
                  {cert.verification_code && (
                    <Link
                      href={`/verify/${cert.verification_code}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 hover:underline"
                    >
                      <span>Public Verify</span>
                      <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* High-Density Modern Table View */
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Public Verify</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificates.map((certificate) => {
                const catName = courseCategoryMap[certificate.course_name.trim().toLowerCase()]
                return <CertificateTableRow key={certificate.id} certificate={certificate} categoryName={catName} />
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Pagination Controls */}
      <div className="bg-white border border-gray-200/90 rounded-2xl px-5 py-3 shadow-xs flex items-center justify-between text-xs text-gray-600">
        <div>
          Showing page <span className="font-semibold text-gray-900">{page}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalPages}</span> ({totalCount} total certificates)
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/certificates?${new URLSearchParams({
              ...(initialSearch ? { search: initialSearch } : {}),
              ...(categoryId ? { categoryId } : {}),
              ...(course ? { course } : {}),
              sort,
              direction,
              page: String(Math.max(1, page - 1)),
              pageSize: String(pageSize),
            })}`}
            aria-disabled={page <= 1}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 font-medium transition-colors ${
              page <= 1 ? 'pointer-events-none opacity-40 bg-gray-50' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </Link>

          <Link
            href={`/certificates?${new URLSearchParams({
              ...(initialSearch ? { search: initialSearch } : {}),
              ...(categoryId ? { categoryId } : {}),
              ...(course ? { course } : {}),
              sort,
              direction,
              page: String(page + 1),
              pageSize: String(pageSize),
            })}`}
            aria-disabled={page >= totalPages}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 font-medium transition-colors ${
              page >= totalPages ? 'pointer-events-none opacity-40 bg-gray-50' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
