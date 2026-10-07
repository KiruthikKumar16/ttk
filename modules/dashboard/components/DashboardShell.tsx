'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import type { Role } from '@/lib/types'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'

import { SettingsDrawer } from '@/components/ui/SettingsDrawer'

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    if (mobileOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => !prev)
    }
  }

  return (
    <div className="app-shell p-0 md:p-3 lg:p-4 bg-[var(--bg)] min-h-screen box-border flex">
      {/* 36px Rounded Outer Shell */}
      <div className="app-shell-inner flex w-full min-h-full md:min-h-[calc(100vh-2rem)] rounded-none md:rounded-[36px] bg-[var(--shell)] border border-[var(--border)] overflow-hidden shadow-xs">
        {/* Desktop / Large Screen Sidebar */}
        <Sidebar role={role} collapsed={collapsed} />

        {/* Mobile / Tablet / Foldable Slide-Over Drawer */}
        {mobileOpen && (
          <div
            className="mobile-drawer fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-left duration-200 bg-[var(--shell)] border-r border-[var(--border)]">
              {/* Top Close Button for Mobile Accessibility */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--mute)]">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Sidebar role={role} collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="main-area flex-1 flex flex-col min-w-0 bg-[var(--shell)]">
          <Topbar onMenu={handleToggleMenu} role={role} />
          <main className="content flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--panel)] m-2 sm:m-3 rounded-[26px] border border-[var(--border)]">
            {children}
          </main>
        </div>
      </div>

      {/* Global Settings Drawer (Theme + Accent) */}
      <SettingsDrawer />
    </div>
  )
}
