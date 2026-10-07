'use client'

import React from 'react'
import { PillButton } from '@/components/ui/PillButton'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--panel)] p-10 text-center ${className}`}
    >
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[var(--g1)] transition-transform duration-300 hover:scale-105"
          style={{ background: 'var(--g4)' }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-[var(--text-heading)]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[var(--mute)] leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <PillButton onClick={onAction} icon={actionIcon}>
            {actionLabel}
          </PillButton>
        </div>
      )}
    </div>
  )
}
