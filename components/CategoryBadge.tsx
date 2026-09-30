import React from 'react'

export function getCategoryBadgeStyle(categoryName?: string | null): {
  badge: string
  bg: string
  text: string
  border: string
  pill: string
} {
  if (!categoryName) {
    return {
      badge: 'bg-slate-50 text-slate-700 border-slate-200',
      bg: 'bg-slate-100 text-slate-700',
      text: 'text-slate-700',
      border: 'border-slate-200',
      pill: 'bg-slate-100 text-slate-800 border-slate-200',
    }
  }

  const lower = categoryName.toLowerCase().trim()
  if (lower.includes('internship')) {
    return {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      bg: 'bg-emerald-100 text-emerald-700',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      pill: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
    }
  }
  if (lower.includes('essential')) {
    return {
      badge: 'bg-amber-50 text-amber-800 border-amber-300',
      bg: 'bg-amber-100 text-amber-700',
      text: 'text-amber-800',
      border: 'border-amber-300',
      pill: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    }
  }
  if (lower.includes('elite')) {
    return {
      badge: 'bg-purple-50 text-purple-800 border-purple-300',
      bg: 'bg-purple-100 text-purple-700',
      text: 'text-purple-800',
      border: 'border-purple-300',
      pill: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100',
    }
  }

  return {
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    bg: 'bg-blue-100 text-blue-700',
    text: 'text-blue-800',
    border: 'border-blue-200',
    pill: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
  }
}

export function CategoryBadge({
  categoryName,
  duration,
  className = '',
}: {
  categoryName?: string | null
  duration?: string | null
  className?: string
}) {
  if (!categoryName) return null
  const style = getCategoryBadgeStyle(categoryName)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style.badge} ${className}`}
    >
      <span>{categoryName}</span>
      {duration && <span className="opacity-75 font-normal text-[10px]">({duration})</span>}
    </span>
  )
}
