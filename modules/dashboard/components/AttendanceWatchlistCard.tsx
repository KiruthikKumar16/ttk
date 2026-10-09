'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Phone,
  X,
} from 'lucide-react'
import { ModernTable } from '@/components/ui/ModernTable'

export interface WatchlistStudent {
  id: string
  registerId: number
  name: string
  course: string
  phone?: string | null
  totalSessions: number
  presentSessions: number
  rate: number
}

export interface AttendanceWatchlistCardProps {
  students?: WatchlistStudent[]
  isLoading?: boolean
  className?: string
}

export function AttendanceWatchlistCard({
  students = [],
  isLoading = false,
  className = '',
}: AttendanceWatchlistCardProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  const hasMoreThanTwo = students.length > 2
  const displayedStudents = hasMoreThanTwo ? students.slice(0, 2) : students

  const columns = [
    { header: 'Student', align: 'left' as const, className: 'w-[36%]' },
    { header: 'Course', align: 'left' as const, className: 'w-[32%]' },
    { header: 'Attendance', align: 'right' as const, className: 'w-[18%]' },
    { header: 'Action', align: 'right' as const, className: 'w-[14%]' },
  ]

  const buildRows = (items: WatchlistStudent[], onNavigate?: () => void) =>
    items.map((s) => {
      const isCritical = s.rate < 60
      return {
        id: s.id,
        onClick: () => {
          if (onNavigate) onNavigate()
          router.push(`/students/${s.registerId}`)
        },
        title: `View ${s.name} profile`,
        cells: [
          <div key="student" className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs text-[var(--text-heading)] group-hover:text-[var(--g1)] transition-colors truncate">
                {s.name}
              </span>
              <span className="text-[10px] text-[var(--mute)] font-mono bg-[var(--hover-bg)] px-1.5 py-0.5 rounded shrink-0">
                #{s.registerId}
              </span>
            </div>
            {s.phone && (
              <span className="text-[10px] text-[var(--mute)] mt-0.5 flex items-center gap-1">
                <Phone size={9} /> {s.phone}
              </span>
            )}
          </div>,
          <span
            key="course"
            className="text-xs text-[var(--mute)] font-medium truncate block max-w-[150px]"
            title={s.course}
          >
            {s.course}
          </span>,
          <div key="attendance" className="flex flex-col items-end">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                isCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                  : 'bg-amber-50 text-amber-800 border-amber-200/60'
              }`}
            >
              {s.rate}%
            </span>
            <span className="text-[10px] text-[var(--mute)] mt-0.5 font-medium whitespace-nowrap">
              {s.presentSessions}/{s.totalSessions} days
            </span>
          </div>,
          <div key="action" className="flex items-center justify-end">
            <Link
              href={`/students/${s.registerId}`}
              onClick={(e) => {
                e.stopPropagation()
                if (onNavigate) onNavigate()
              }}
              className="inline-flex items-center text-xs font-semibold text-[var(--g1)] hover:underline whitespace-nowrap"
            >
              View &rarr;
            </Link>
          </div>,
        ],
      }
    })

  return (
    <>
      <div
        className={`panel p-5 flex flex-col justify-between transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[var(--g5)] ${className}`}
      >
        <div>
          {/* Header: Title on Left, View all attendance on Right */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <h2 className="text-sm font-semibold text-slate-900">Attendance Watchlist</h2>
            </div>

            <Link
              href="/attendance"
              className="group text-xs font-semibold flex items-center gap-1 text-[var(--g1)] hover:underline underline-offset-4 decoration-[var(--g1)] transition-all cursor-pointer"
              style={{ color: 'var(--g1)' }}
            >
              <span>View all attendance</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Table View matching Recent Assessments below */}
          <div className="mt-4 overflow-hidden">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] animate-pulse flex items-center justify-between"
                  >
                    <div className="space-y-1.5 w-2/3">
                      <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                      <div className="h-2.5 bg-slate-100 rounded w-3/4" />
                    </div>
                    <div className="h-6 w-12 bg-slate-200 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <ModernTable
                columns={columns}
                rows={buildRows(displayedStudents)}
                emptyMessage="All active students meet the 75% threshold!"
              />
            )}
          </div>

          {/* Centered Downward Arrow Button (when more than 2 students) */}
          {!isLoading && hasMoreThanTwo && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--g4)] hover:border-[var(--g1)] text-xs font-semibold text-[var(--text-heading)] transition-all duration-200 cursor-pointer shadow-2xs group"
                title={`View all ${students.length} students on watchlist`}
              >
                <span className="text-[11px] text-[var(--mute)] group-hover:text-[var(--g1)] transition-colors">
                  Show all {students.length} students ({students.length - 2} more)
                </span>
                <ChevronDown
                  size={14}
                  className="text-[var(--g1)] transition-transform duration-200 group-hover:translate-y-0.5"
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer Threshold Indicator (aligned with Today's Attendance Summary progress section) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">Watchlist Threshold</span>
          <span className="font-bold text-amber-700">&lt; 75% Attendance</span>
        </div>
      </div>

      {/* Popup / Modal Dialog for Full Watchlist */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="watchlist-modal-title"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 id="watchlist-modal-title" className="text-sm font-bold text-[var(--text-heading)]">
                  Attendance Watchlist (&lt; 75%)
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1"
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#92400e',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                  }}
                >
                  {students.length} Students
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--text-heading)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Student Table */}
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
              <ModernTable
                columns={columns}
                rows={buildRows(students, () => setIsModalOpen(false))}
                emptyMessage="All active students meet the 75% threshold!"
              />
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <Link
                href="/attendance"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold text-[var(--g1)] hover:underline flex items-center gap-1"
              >
                Open Full Attendance Registry <ArrowRight size={12} />
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover-bg)] text-xs font-semibold text-[var(--text-heading)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AttendanceWatchlistCard
