'use client'

import React from 'react'

export interface TagProps {
  children: React.ReactNode
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'hatched'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Tag({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  style,
}: TagProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  }[size]

  let variantStyle: React.CSSProperties = {}
  let variantClass = ''

  if (variant === 'accent') {
    variantStyle = {
      backgroundColor: 'var(--g4)',
      color: 'var(--g1)',
      borderColor: 'var(--g5)',
    }
    variantClass = 'border'
  } else if (variant === 'success') {
    variantStyle = {
      backgroundColor: 'var(--success-bg)',
      color: '#1b7a4b',
      borderColor: 'rgba(27, 122, 75, 0.2)',
    }
    variantClass = 'border'
  } else if (variant === 'warning') {
    variantStyle = {
      backgroundColor: 'var(--warning-bg)',
      color: '#a8710f',
      borderColor: 'rgba(168, 113, 15, 0.2)',
    }
    variantClass = 'border'
  } else if (variant === 'danger') {
    variantStyle = {
      backgroundColor: 'var(--danger-bg)',
      color: '#b53c37',
      borderColor: 'rgba(181, 60, 55, 0.2)',
    }
    variantClass = 'border'
  } else if (variant === 'info') {
    variantStyle = {
      backgroundColor: 'var(--info-bg)',
      color: '#0284c7',
      borderColor: 'rgba(2, 132, 199, 0.2)',
    }
    variantClass = 'border'
  } else if (variant === 'hatched') {
    variantStyle = {
      background:
        'repeating-linear-gradient(45deg, rgba(100, 116, 139, 0.12) 0, rgba(100, 116, 139, 0.12) 4px, transparent 4px, transparent 8px)',
      color: 'var(--mute)',
      borderColor: 'var(--border)',
    }
    variantClass = 'border'
  } else {
    // neutral
    variantClass = 'bg-[var(--panel)] text-[var(--mute)] border border-[var(--border)]'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full leading-none transition-colors ${sizeClasses} ${variantClass} ${className}`}
      style={{ ...variantStyle, ...style }}
    >
      {icon}
      <span>{children}</span>
    </span>
  )
}
