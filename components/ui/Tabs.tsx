'use client'

import React from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number | string
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--panel)] p-1 border border-[var(--border)] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--g1)] ${
              isActive
                ? 'bg-[var(--card)] text-[var(--text-heading)] shadow-sm'
                : 'text-[var(--mute)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-0.5 rounded-full px-2 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? 'bg-[var(--g4)] text-[var(--g1)]'
                    : 'bg-[var(--border)] text-[var(--mute)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
