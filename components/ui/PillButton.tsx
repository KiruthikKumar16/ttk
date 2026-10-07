'use client'

import React from 'react'

export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  loading?: boolean
  children: React.ReactNode
}

export function PillButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  children,
  className = '',
  disabled,
  style,
  ...props
}: PillButtonProps) {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 font-medium',
    md: 'px-5 py-2.5 text-sm gap-2 font-semibold',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
  }[size]

  let variantStyle: React.CSSProperties = {}
  let variantClass = ''

  if (variant === 'primary') {
    variantClass =
      'text-white hover:brightness-105 active:scale-[0.98] shadow-sm hover:shadow-[0_4px_16px_-4px_var(--g1b)]'
    variantStyle = {
      background: 'linear-gradient(135deg, var(--g1) 0%, var(--g1b) 100%)',
    }
  } else if (variant === 'secondary') {
    variantClass =
      'bg-[var(--panel)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--hover-bg)] active:scale-[0.98]'
  } else if (variant === 'outline') {
    variantClass = 'bg-transparent border border-[var(--g1)] text-[var(--g1)] hover:bg-[var(--g4)] active:scale-[0.98]'
  } else if (variant === 'danger') {
    variantClass = 'bg-[#b53c37] text-white hover:bg-[#9e332f] active:scale-[0.98] shadow-sm'
  } else if (variant === 'ghost') {
    variantClass = 'bg-transparent text-[var(--text)] hover:bg-[var(--hover-bg)] active:scale-[0.98]'
  }

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--g1)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses} ${variantClass} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      <span>{children}</span>
      {iconRight}
    </button>
  )
}
