'use client'

import React from 'react'

export interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const sizeMap = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size]

  const initials = name
    ? name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-[var(--border)] ${sizeMap} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold transition-transform select-none ${sizeMap} ${className}`}
      style={{
        background: 'var(--g4)',
        color: 'var(--g1)',
        border: '1px solid var(--g5)',
      }}
    >
      {initials}
    </div>
  )
}
