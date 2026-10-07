'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export interface DatePickerRowProps {
  currentDate: string // YYYY-MM-DD
  onDateChange: (newDate: string) => void
  className?: string
}

export function DatePickerRow({ currentDate, onDateChange, className = '' }: DatePickerRowProps) {
  const handlePrev = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    onDateChange(d.toISOString().slice(0, 10))
  }

  const handleToday = () => {
    onDateChange(new Date().toISOString().slice(0, 10))
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    onDateChange(d.toISOString().slice(0, 10))
  }

  const formattedDate = new Date(currentDate).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous day"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        onClick={handleToday}
        className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        Today
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next day"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>

      <div className="mx-1 h-4 w-[1px] bg-[var(--border)]" />

      <label className="flex items-center gap-1.5 px-2 text-xs font-medium text-[var(--text-heading)] cursor-pointer">
        <Calendar size={13} className="text-[var(--g1)]" />
        <span>{formattedDate}</span>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  )
}
