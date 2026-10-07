'use client'

import React from 'react'

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  badge?: {
    text: string
    variant?: 'success' | 'warning' | 'danger' | 'accent' | 'neutral'
  }
  icon?: React.ReactNode | React.ElementType
  variant?: 'normal' | 'hero'
  className?: string
  onClick?: () => void
}

function renderKpiIcon(icon: React.ReactNode | React.ElementType, size = 20) {
  if (!icon) return null
  if (React.isValidElement(icon)) return icon
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
    const IconComp = icon as React.ElementType
    return <IconComp size={size} />
  }
  return icon as React.ReactNode
}

export function KpiCard({
  title,
  value,
  subtitle,
  badge,
  icon,
  variant = 'normal',
  className = '',
  onClick,
}: KpiCardProps) {
  if (variant === 'hero') {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden rounded-[22px] p-6 text-white transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        style={{
          background: 'linear-gradient(135deg, var(--g2b) 0%, var(--g1) 55%, var(--g1b) 100%)',
          boxShadow: '0 8px 28px -6px var(--g1b)',
        }}
      >
        {/* Subtle decorative glow watermark */}
        <div
          className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full opacity-20 blur-2xl"
          style={{ background: 'var(--g3)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/80">{title}</p>
            <div className="mt-2 text-[44px] font-extrabold tracking-tight leading-none text-white">{value}</div>
          </div>
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md">
              {renderKpiIcon(icon, 20)}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-white/15 pt-3">
          {subtitle && <p className="text-[13px] font-medium text-white/85">{subtitle}</p>}
          {badge && (
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
              {badge.text}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Normal variant
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-[22px] border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-[var(--mute)]">{title}</p>
          <div className="mt-1.5 text-[44px] font-bold tracking-tight leading-none text-[var(--text-heading)]">
            {value}
          </div>
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
            style={{
              background: 'var(--g4)',
              color: 'var(--g1)',
            }}
          >
            {renderKpiIcon(icon, 18)}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
        {subtitle && <p className="text-[12px] text-[var(--mute)]">{subtitle}</p>}
        {badge && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              badge.variant === 'success'
                ? 'bg-[var(--success-bg)] text-[#1b7a4b]'
                : badge.variant === 'warning'
                  ? 'bg-[var(--warning-bg)] text-[#854d0e]'
                  : badge.variant === 'danger'
                    ? 'bg-[var(--danger-bg)] text-[#b53c37]'
                    : badge.variant === 'accent'
                      ? 'bg-[var(--g4)] text-[var(--g1)]'
                      : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
}
