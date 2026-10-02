'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Receipt,
  CreditCard,
  Banknote,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react'
import { money } from '@/lib/formatters'
import { CategoryBadge } from '@/components/CategoryBadge'
import { InvoiceTableRow } from './InvoiceTableRow'
import type { Payment } from '@/lib/types'

interface InvoicesManagerClientProps {
  payments: Payment[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  dateFilter?: string
  startDateFilter?: string
  endDateFilter?: string
  sort: string
  direction: 'asc' | 'desc'
  courseCategoryMap: Record<string, string>
}

export function InvoicesManagerClient({
  payments,
  totalCount,
  page,
  pageSize,
  search: initialSearch,
  dateFilter: initialDate = '',
  startDateFilter: initialStartDate = '',
  endDateFilter: initialEndDate = '',
  sort,
  direction,
  courseCategoryMap,
}: InvoicesManagerClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [searchInput, setSearchInput] = useState(initialSearch)
  const isRangeInitial = Boolean(initialStartDate || initialEndDate)
  const [dateMode, setDateMode] = useState<'single' | 'range'>(isRangeInitial ? 'range' : 'single')
  const [dateInput, setDateInput] = useState(initialDate)
  const [startDateInput, setStartDateInput] = useState(initialStartDate)
  const [endDateInput, setEndDateInput] = useState(initialEndDate)

  // Compute metrics
  const totalVolume = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.amount || 0), 0)
  }, [payments])

  const avgPayment = useMemo(() => {
    if (!payments.length) return 0
    return Math.round(totalVolume / payments.length)
  }, [totalVolume, payments.length])

  // Payment method counts
  const methodCounts = useMemo(() => {
    const res = { upi: 0, bank: 0, cash: 0 }
    payments.forEach((p) => {
      const m = (p.method || '').toLowerCase()
      if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe')) res.upi++
      else if (m.includes('bank') || m.includes('net') || m.includes('neft')) res.bank++
      else res.cash++
    })
    return res
  }, [payments])

  // Handle Search & Filter Submission
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set('search', searchInput.trim())
    } else {
      params.delete('search')
    }

    if (dateMode === 'single') {
      params.delete('startDate')
      params.delete('endDate')
      if (dateInput) {
        params.set('date', dateInput)
      } else {
        params.delete('date')
      }
    } else {
      params.delete('date')
      if (startDateInput) {
        params.set('startDate', startDateInput)
      } else {
        params.delete('startDate')
      }
      if (endDateInput) {
        params.set('endDate', endDateInput)
      } else {
        params.delete('endDate')
      }
    }

    params.set('page', '1')
    router.push(`/invoices?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setDateInput('')
    setStartDateInput('')
    setEndDateInput('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('date')
    params.delete('startDate')
    params.delete('endDate')
    params.set('page', '1')
    router.push(`/invoices?${params.toString()}`)
  }

  const hasActiveFilter = Boolean(initialSearch || initialDate || initialStartDate || initialEndDate)

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', newSort)
    params.set('page', '1')
    router.push(`/invoices?${params.toString()}`)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              Tax & Fee Collections
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoices</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Browse tax invoices, fee receipts, and installment milestones categorized by curriculum tier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Banknote size={15} className="text-gray-500" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
              Page Collections Volume
            </span>
            <div className="text-xl font-bold text-emerald-700 leading-tight mt-0.5">{money(totalVolume)}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200/60">
            <Receipt size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
              Total Invoices
            </span>
            <div className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
              {totalCount} <span className="text-xs text-gray-500 font-normal">Records</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-200/60">
            <CreditCard size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
              Average Receipt
            </span>
            <div className="text-xl font-bold text-purple-700 leading-tight mt-0.5">{money(avgPayment)}</div>
          </div>
        </div>
      </div>

      {/* Search, Date Filter, Sort, and View Mode Toolbar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              aria-label="Search invoice number, student name, or course"
              placeholder="Search invoice number, student name, or course..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                aria-label="Clear search input"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date Filter Mode Selector */}
          <div
            className="flex items-center p-0.5 bg-gray-100 rounded-xl border border-gray-200 shrink-0"
            role="group"
            aria-label="Date filter selection mode"
          >
            <button
              type="button"
              id="invoice-filter-mode-single"
              onClick={() => setDateMode('single')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                dateMode === 'single'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={dateMode === 'single'}
            >
              Single Date
            </button>
            <button
              type="button"
              id="invoice-filter-mode-range"
              onClick={() => setDateMode('range')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                dateMode === 'range'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={dateMode === 'range'}
            >
              Date Range
            </button>
          </div>

          {/* Single Date Picker */}
          {dateMode === 'single' ? (
            <div className="flex items-center gap-1.5 border border-gray-300 rounded-xl px-2.5 py-1.5 bg-white">
              <Calendar size={14} className="text-gray-500 shrink-0" />
              <input
                id="invoice-single-date"
                type="date"
                aria-label="Filter invoices by date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="text-xs text-gray-800 bg-transparent focus:outline-none"
              />
              {dateInput && (
                <button
                  type="button"
                  onClick={() => setDateInput('')}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Clear date filter"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ) : (
            /* Date Range Pickers */
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 border border-gray-300 rounded-xl px-2.5 py-1.5 bg-white">
                <span className="text-[11px] font-semibold text-gray-600">From:</span>
                <input
                  id="invoice-start-date"
                  type="date"
                  aria-label="Filter invoices from start date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="text-xs text-gray-800 bg-transparent focus:outline-none"
                />
                {startDateInput && (
                  <button
                    type="button"
                    onClick={() => setStartDateInput('')}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label="Clear start date filter"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 border border-gray-300 rounded-xl px-2.5 py-1.5 bg-white">
                <span className="text-[11px] font-semibold text-gray-600">To:</span>
                <input
                  id="invoice-end-date"
                  type="date"
                  aria-label="Filter invoices to end date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="text-xs text-gray-800 bg-transparent focus:outline-none"
                />
                {endDateInput && (
                  <button
                    type="button"
                    onClick={() => setEndDateInput('')}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label="Clear end date filter"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-2xs transition-colors"
          >
            Apply Filter
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </form>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <label htmlFor="invoices-sort-select" className="hidden sm:inline font-medium">
              Sort:
            </label>
            <select
              id="invoices-sort-select"
              aria-label="Sort invoices"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="invoice">Invoice #</option>
              <option value="payment_date">Payment Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid Cards vs Dense Table */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Table List View"
            >
              <ListIcon size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Financial Cards View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {payments.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <Receipt size={28} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No invoices found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            {hasActiveFilter
              ? 'No invoices match your selected search or date criteria. Try resetting filters.'
              : 'No invoices have been recorded yet.'}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Financial Cards Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => {
            const catName = p.course ? courseCategoryMap[p.course.trim().toLowerCase()] : null
            const invoiceUrl = `/invoices/${encodeURIComponent(p.invoice)}`

            return (
              <div
                key={p.id}
                onClick={() => router.push(invoiceUrl)}
                className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
                title={`Click to open invoice ${p.invoice}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {p.invoice}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div className="text-xl font-bold text-gray-900">{money(p.amount)}</div>
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      {p.method}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                      Student
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">{p.student}</h3>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate max-w-[65%]">{p.course || '—'}</span>
                    {catName && <CategoryBadge categoryName={catName} />}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1 text-[11px] text-gray-600">
                    <Calendar size={12} className="text-gray-500" />
                    <span>{p.date}</span>
                  </div>
                  <span className="text-emerald-600 group-hover:underline font-semibold text-[11px]">
                    View Invoice ↗
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* High-Density Elevated Table View */
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <InvoiceTableRow key={payment.id} payment={payment} courseCategoryMap={courseCategoryMap} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="bg-white border border-gray-200/90 rounded-2xl px-5 py-3 shadow-xs flex items-center justify-between text-xs text-gray-600">
        <div>
          Showing page <span className="font-semibold text-gray-900">{page}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalPages}</span> ({totalCount} total invoices)
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices?${new URLSearchParams({
              ...(initialSearch ? { search: initialSearch } : {}),
              ...(initialDate ? { date: initialDate } : {}),
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
            href={`/invoices?${new URLSearchParams({
              ...(initialSearch ? { search: initialSearch } : {}),
              ...(initialDate ? { date: initialDate } : {}),
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
