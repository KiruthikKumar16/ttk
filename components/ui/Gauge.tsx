'use client'

import React from 'react'

export interface GaugeProps {
  value: number // 0 to 100
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  className?: string
}

export function Gauge({
  value,
  size = 140,
  strokeWidth = 12,
  label,
  sublabel,
  className = '',
}: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const center = size / 2

  // Semicircle arc length = PI * radius
  const arcLength = Math.PI * radius
  const strokeDashoffset = arcLength - (clamped / 100) * arcLength

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 10 }}>
        <svg
          width={size}
          height={size / 2 + 10}
          viewBox={`0 0 ${size} ${size / 2 + 10}`}
          className="overflow-visible"
        >
          {/* Background Track */}
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
            fill="none"
            stroke="var(--g1)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Value text in center */}
        <div className="absolute bottom-0 text-center">
          <div className="text-2xl font-extrabold text-[var(--text-heading)] leading-none">
            {Math.round(clamped)}%
          </div>
        </div>
      </div>

      {label && <p className="mt-2 text-xs font-semibold text-[var(--text)]">{label}</p>}
      {sublabel && <p className="text-[11px] text-[var(--mute)]">{sublabel}</p>}
    </div>
  )
}
