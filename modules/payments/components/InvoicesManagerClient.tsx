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
import { KpiCard } from '@/components/ui/KpiCard'

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'var(--panel)', color: 'var(--g1)' }}
            >
              Fee Collections & Billing
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--mute)]">FINANCIAL LEDGER</p>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Invoices</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Browse tax invoices, fee receipts, and installment milestones categorized by curriculum tier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/invoices/record"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
          >
            <Banknote size={15} />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Page Collections Volume"
          value={money(totalVolume)}
          subtitle="Aggregated payments on this page"
          icon={TrendingUp}
        />

        <KpiCard title="Total Invoices" value={totalCount} subtitle="All-time issued invoices" icon={Receipt} />

        <KpiCard
          title="Average Receipt"
          value={money(avgPayment)}
          subtitle="Average ticket size per transaction"
          icon={CreditCard}
        />
      </div>

      {/* Search, Date Filter, Sort, and View Mode Toolbar */}
      <div className="bg-[var(--card)] p-4 rounded-[22px] border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              type="text"
              aria-label="Search invoice number, student name, or course"
              placeholder="Search invoice number, student name, or course..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] placeholder-[var(--mute)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)] bg-[var(--panel)]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)] p-0.5 cursor-pointer"
                aria-label="Clear search input"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date Filter Mode Selector */}
          <div
            className="flex items-center p-1 bg-[var(--panel)] rounded-full border border-[var(--border)] shrink-0 gap-1"
            role="group"
            aria-label="Date filter selection mode"
          >
            <button
              type="button"
              id="invoice-filter-mode-single"
              onClick={() => setDateMode('single')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                dateMode === 'single' ? 'text-white shadow-2xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              style={dateMode === 'single' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
              aria-pressed={dateMode === 'single'}
            >
              Single Date
            </button>
            <button
              type="button"
              id="invoice-filter-mode-range"
              onClick={() => setDateMode('range')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                dateMode === 'range' ? 'text-white shadow-2xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              style={dateMode === 'range' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
              aria-pressed={dateMode === 'range'}
            >
              Date Range
            </button>
          </div>

          {/* Single Date Picker */}
          {dateMode === 'single' ? (
            <div className="flex items-center gap-1.5 border border-[var(--border)] rounded-full px-3 py-1.5 bg-[var(--panel)]">
              <Calendar size={14} className="text-[var(--mute)] shrink-0" />
              <input
                id="invoice-single-date"
                type="date"
                aria-label="Filter invoices by date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="text-xs text-[var(--text)] bg-transparent focus:outline-none"
              />
              {dateInput && (
                <button
                  type="button"
                  onClick={() => setDateInput('')}
                  className="text-[var(--mute)] hover:text-[var(--text)] p-0.5 cursor-pointer"
                  aria-label="Clear date filter"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ) : (
            /* Date Range Pickers */
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 border border-[var(--border)] rounded-full px-3 py-1.5 bg-[var(--panel)]">
                <span className="text-[11px] font-bold text-[var(--mute)]">From:</span>
                <input
                  id="invoice-start-date"
                  type="date"
                  aria-label="Filter invoices from start date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="text-xs text-[var(--text)] bg-transparent focus:outline-none"
                />
                {startDateInput && (
                  <button
                    type="button"
                    onClick={() => setStartDateInput('')}
                    className="text-[var(--mute)] hover:text-[var(--text)] p-0.5 cursor-pointer"
                    aria-label="Clear start date filter"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 border border-[var(--border)] rounded-full px-3 py-1.5 bg-[var(--panel)]">
                <span className="text-[11px] font-bold text-[var(--mute)]">To:</span>
                <input
                  id="invoice-end-date"
                  type="date"
                  aria-label="Filter invoices to end date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="text-xs text-[var(--text)] bg-transparent focus:outline-none"
                />
                {endDateInput && (
                  <button
                    type="button"
                    onClick={() => setEndDateInput('')}
                    className="text-[var(--mute)] hover:text-[var(--text)] p-0.5 cursor-pointer"
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
            className="px-4 py-2 text-xs font-bold text-white rounded-full shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
          >
            Apply Filter
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-[var(--mute)] hover:text-[var(--text)] font-semibold px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--mute)]">
            <label htmlFor="invoices-sort-select" className="hidden sm:inline font-bold">
              Sort:
            </label>
            <select
              id="invoices-sort-select"
              aria-label="Sort invoices"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-full text-xs text-[var(--text)] bg-[var(--panel)] focus:outline-none focus:ring-1 focus:ring-[var(--g1)] font-semibold"
            >
              <option value="invoice">Invoice #</option>
              <option value="payment_date">Payment Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid Cards vs Dense Table */}
          <div className="flex items-center bg-[var(--panel)] p-1 rounded-full border border-[var(--border)] gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'text-white shadow-2xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              style={viewMode === 'table' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
              title="Table List View"
            >
              <ListIcon size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'text-white shadow-2xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              style={viewMode === 'grid' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}}
              title="Financial Cards View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {payments.length === 0 ? (
        <div className="bg-[var(--card)] border border-dashed border-[var(--border)] rounded-[22px] p-12 text-center shadow-xs">
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3"
            style={{ background: 'var(--panel)', color: 'var(--g1)' }}
          >
            <Receipt size={28} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] mb-1">No invoices found</h3>
          <p className="text-xs text-[var(--mute)] max-w-sm mx-auto mb-4">
            {hasActiveFilter
              ? 'No invoices match your selected search or date criteria. Try resetting filters.'
              : 'No invoices have been recorded yet.'}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold hover:underline cursor-pointer"
              style={{ color: 'var(--g1)' }}
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
                className="bg-[var(--card)] border border-[var(--border)] rounded-[22px] p-5 shadow-xs hover:border-[var(--g1)] transition-all cursor-pointer group flex flex-col justify-between"
                title={`Click to open invoice ${p.invoice}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-[var(--text)] group-hover:text-[var(--g1)] transition-colors">
                      {p.invoice}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#1b7a4b]">
                      Paid
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div className="text-2xl font-extrabold text-[var(--text)]">{money(p.amount)}</div>
                    <span className="text-[11px] font-semibold text-[var(--mute)] bg-[var(--panel)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                      {p.method}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[var(--border)]">
                    <span className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider block">
                      Student
                    </span>
                    <h3 className="text-sm font-bold text-[var(--text)] leading-snug mt-0.5">{p.student}</h3>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[var(--mute)] truncate max-w-[65%]">{p.course || '—'}</span>
                    {catName && <CategoryBadge categoryName={catName} />}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--mute)]">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Calendar size={12} className="text-[var(--mute)]" />
                    <span>{p.date}</span>
                  </div>
                  <span className="font-bold text-[11px] hover:underline" style={{ color: 'var(--g1)' }}>
                    View Invoice ↗
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* High-Density Elevated Table View */
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-[var(--border)]">
              {payments.map((payment) => (
                <InvoiceTableRow key={payment.id} payment={payment} courseCategoryMap={courseCategoryMap} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-full px-5 py-3 shadow-xs flex items-center justify-between text-xs text-[var(--mute)]">
        <div>
          Showing page <span className="font-bold text-[var(--text)]">{page}</span> of{' '}
          <span className="font-bold text-[var(--text)]">{totalPages}</span> ({totalCount} total invoices)
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
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] font-bold transition-colors ${
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-[var(--card)] text-[var(--text)]'
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
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] font-bold transition-colors ${
              page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-[var(--card)] text-[var(--text)]'
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
