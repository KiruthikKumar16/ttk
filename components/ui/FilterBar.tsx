'use client'

import React from 'react'
import { Search, LayoutGrid, TableProperties } from 'lucide-react'

export interface FilterBarProps {
  search?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  viewMode?: 'table' | 'cards'
  onViewModeChange?: (mode: 'table' | 'cards') => void
  children?: React.ReactNode // Extra chips / selects / actions
  className?: string
}

export function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  viewMode,
  onViewModeChange,
  children,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-xs ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[240px]">
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] py-2 pl-9 pr-4 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--mute)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
            />
          </div>
        )}
        {children}
      </div>

      {viewMode && onViewModeChange && (
        <div className="flex items-center rounded-full border border-[var(--border)] bg-[var(--panel)] p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            aria-label="Table view"
            title="Table view"
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[var(--card)] text-[var(--g1)] shadow-xs font-bold'
                : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
          >
            <TableProperties size={15} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            aria-label="Cards view"
            title="Cards grid view"
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[var(--card)] text-[var(--g1)] shadow-xs font-bold'
                : 'text-[var(--mute)] hover:text-[var(--text)]'
            }`}
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
