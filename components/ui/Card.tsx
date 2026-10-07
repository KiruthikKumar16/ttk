'use client'

import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[22px] border border-[var(--card-border)] bg-[var(--card)] text-[var(--text)] transition-all duration-200 ${
        noPadding ? '' : 'p-6'
      } ${className}`}
      style={{
        boxShadow: 'var(--shadow-card)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}
