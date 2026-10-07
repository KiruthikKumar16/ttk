'use client'

import React from 'react'

export interface BarDatum {
  label: string
  value: number // percentage 0-100 or actual count
  maxValue?: number
  isHatched?: boolean // hatched = pending/absent, solid = done
  secondaryValue?: number // e.g. target or inactive portion
  tooltip?: string
}

export interface PillBarChartProps {
  data: BarDatum[]
  height?: number
  showLabels?: boolean
  className?: string
}

export function PillBarChart({ data, height = 140, showLabels = true, className = '' }: PillBarChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-2.5 sm:gap-4" style={{ height }}>
        {data.map((item, idx) => {
          const max = item.maxValue || 100
          const pct = Math.min(100, Math.max(0, (item.value / max) * 100))
          const isHatched = item.isHatched ?? false

          return (
            <div key={idx} className="group flex flex-1 flex-col items-center justify-end h-full relative">
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-8 z-20 hidden rounded-md bg-[var(--text-heading)] px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block whitespace-nowrap">
                {item.tooltip || `${item.label}: ${item.value}`}
              </div>

              {/* Bar track container */}
              <div className="relative w-full max-w-[28px] rounded-full bg-[var(--panel)] border border-[var(--border)] overflow-hidden h-full flex flex-col justify-end">
                {/* Active Pill Fill */}
                <div
                  className={`w-full rounded-full transition-all duration-500 ease-out ${
                    isHatched ? 'border-t border-[var(--border)]' : ''
                  }`}
                  style={{
                    height: `${pct}%`,
                    minHeight: pct > 0 ? 8 : 0,
                    background: isHatched
                      ? 'repeating-linear-gradient(45deg, rgba(100, 116, 139, 0.25) 0, rgba(100, 116, 139, 0.25) 3px, transparent 3px, transparent 6px)'
                      : 'linear-gradient(180deg, var(--g2) 0%, var(--g1) 100%)',
                  }}
                />
              </div>

              {/* Bottom Label */}
              {showLabels && (
                <span className="mt-2 text-[11px] font-medium text-[var(--mute)] truncate w-full text-center">
                  {item.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
