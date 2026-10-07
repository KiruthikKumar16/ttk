'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Award,
  GraduationCap,
  ShieldCheck,
  Search,
  LayoutGrid,
  List as ListIcon,
  ExternalLink,
  Eye,
  Calendar,
  BookOpen,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { CategoryBadge } from '@/components/CategoryBadge'
import { CertificateTableRow, type CertificateRowItem } from './CertificateTableRow'
import type { CourseCategory } from '@/lib/types'
import { KpiCard } from '@/components/ui/KpiCard'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Tag variant="warning">Verified Academic Credentials</Tag>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Certificates</h1>
          <p className="text-xs text-[var(--mute)] mt-1 max-w-xl">
            Official completion diplomas, verification QR records, and graduation credentials.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href="/students">
            <PillButton variant="secondary" icon={<GraduationCap size={15} />}>
              Eligible Students
            </PillButton>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Certificates"
          value={totalCount}
          subtitle="Official diplomas issued"
          variant="hero"
          icon={Award}
        />
        <KpiCard
          title="QR Verifiable Records"
          value={verifiableCount}
          subtitle="Cryptographically protected"
          icon={ShieldCheck}
        />
        <KpiCard
          title="Programs Represented"
          value={coursesWithCertificates}
          subtitle="Curricula completed"
          icon={BookOpen}
        />
      </div>

      {/* Program Category Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => handleCategoryFilter(undefined)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            !categoryId
              ? 'bg-[var(--g1)] text-white shadow-xs'
              : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
          }`}
        >
          <Layers size={14} className={!categoryId ? 'text-white' : 'text-[var(--mute)]'} />
          <span>All Programs</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              !categoryId ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = categoryId === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryFilter(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--g1)] text-white shadow-xs'
                  : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
                }`}
              >
                {cat.duration}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search, Sort, and View Mode Switcher Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              type="text"
              placeholder="Search certificate ID, student name, or course..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs text-[var(--mute)]">
              <label htmlFor="certificates-sort-select" className="hidden sm:inline font-medium">
                Sort:
              </label>
              <select
                id="certificates-sort-select"
                aria-label="Sort certificates"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] font-medium"
              >
                <option value="issue_date">Issue Date</option>
                <option value="student_name">Student Name</option>
                <option value="certificate_id">Certificate ID</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid Cards vs Dense Table */}
            <div className="flex items-center bg-[var(--panel)] p-1 rounded-full border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[var(--card)] text-[var(--g1)] shadow-2xs font-bold'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
                title="Diploma Showcase Cards"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-[var(--card)] text-[var(--g1)] shadow-2xs font-bold'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
                title="Table List View"
              >
                <ListIcon size={15} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award size={28} />}
          title="No certificates found"
          description={
            searchInput
              ? `No certificate records match "${searchInput}". Try clearing search filters.`
              : 'No certificates have been issued under this curriculum tier yet.'
          }
          actionLabel={searchInput ? 'Clear Search Filter' : undefined}
          onAction={searchInput ? handleClearSearch : undefined}
        />
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
                className="group bg-[var(--card)] border border-[var(--border)] rounded-[22px] overflow-hidden shadow-xs hover:shadow-lg hover:border-[var(--g1)] transition-all duration-200 cursor-pointer flex flex-col justify-between"
                title={`Click to view & print certificate ${cert.certificate_id}`}
              >
                {/* Diploma Card Frame Header */}
                <div className="bg-[var(--panel)] border-b border-[var(--border)] px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--g1)] text-white flex items-center justify-center shadow-2xs font-bold text-xs">
                      ★
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--ink)] tracking-wide">
                      {cert.certificate_id}
                    </span>
                  </div>
                  {catName ? (
                    <CategoryBadge categoryName={catName} />
                  ) : (
                    <Tag variant="neutral">Standard</Tag>
                  )}
                </div>

                {/* Diploma Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block">
                      Candidate
                    </span>
                    <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-[var(--g1)] transition-colors mt-0.5 leading-snug">
                      {cert.student_name}
                    </h3>
                    <div className="text-xs text-[var(--mute)] mt-1 font-medium">Student #{cert.student_register_id}</div>

                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                      <span className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider block">
                        Course Curriculum
                      </span>
                      <p className="text-xs font-semibold text-[var(--ink)] mt-0.5 line-clamp-1">{cert.course_name}</p>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--mute)]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-[var(--mute)]" />
                      <span>{cert.issue_date}</span>
                    </div>

                    {cert.verification_code ? (
                      <Tag variant="success">QR Verifiable</Tag>
                    ) : (
                      <span className="text-[11px] text-[var(--mute)]">Offline Record</span>
                    )}
                  </div>
                </div>

                {/* Diploma Card Footer Action */}
                <div className="px-5 py-3 bg-[var(--panel)] border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--g1)] font-semibold flex items-center gap-1.5 group-hover:underline">
                    <Eye size={13} /> View & Print Certificate
                  </span>
                  {cert.verification_code && (
                    <Link
                      href={`/verify/${cert.verification_code}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[var(--ink)] hover:text-[var(--g1)] font-semibold flex items-center gap-1 hover:underline"
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
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[26px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">Certificate ID</th>
                  <th className="py-3 px-5">Student</th>
                  <th className="py-3 px-5">Course</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Issue Date</th>
                  <th className="py-3 px-5">Public Verify</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((certificate) => {
                  const catName = courseCategoryMap[certificate.course_name.trim().toLowerCase()]
                  return <CertificateTableRow key={certificate.id} certificate={certificate} categoryName={catName} />
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Pagination Controls */}
      <Card className="px-5 py-3 flex items-center justify-between text-xs text-[var(--mute)]">
        <div>
          Showing page <span className="font-semibold text-[var(--ink)]">{page}</span> of{' '}
          <span className="font-semibold text-[var(--ink)]">{totalPages}</span> ({totalCount} total certificates)
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] font-medium transition-colors ${
              page <= 1 ? 'pointer-events-none opacity-40 bg-[var(--panel)]' : 'hover:bg-[var(--panel)] text-[var(--ink)]'
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] font-medium transition-colors ${
              page >= totalPages ? 'pointer-events-none opacity-40 bg-[var(--panel)]' : 'hover:bg-[var(--panel)] text-[var(--ink)]'
            }`}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  )
}
