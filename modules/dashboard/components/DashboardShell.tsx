'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import type { Role } from '@/lib/types'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'

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
    <div className="app-shell">
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div
            className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-left duration-200"
            style={{ background: 'linear-gradient(180deg, #0c1222 0%, #0f172a 30%, #0c1222 100%)' }}
          >
            {/* Top Close Button for Mobile Accessibility */}
            <div
              className="flex items-center justify-between px-4 pt-3 pb-2"
              style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.1)' }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#64748b', letterSpacing: '1.5px' }}
              >
                Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#64748b' }}
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
      <div className="main-area">
        <Topbar onMenu={handleToggleMenu} role={role} />
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
