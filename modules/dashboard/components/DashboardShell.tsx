'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import type { Role } from '@/lib/types'
import { Sidebar } from '@/components/Sidebar'

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function signOut() {
    setLogoutError('')
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Sign out failed.')
      router.replace('/login')
      router.refresh()
    } catch {
      setLogoutError('Unable to sign out. Please try again.')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar role={role} collapsed={collapsed} />
      <div className="main-area">
        <header className="topbar route-topbar">
          <button
            type="button"
            className="btn-ghost"
            aria-label="Toggle navigation"
            onClick={() => setCollapsed((value) => !value)}
          >
            <Menu size={18} />
          </button>
          <span className="text-sm text-slate-600">ThoorigAI Infotech Admin</span>
          <span role="status" aria-live="polite" className="sr-only">
            {logoutError}
          </span>
          <button
            type="button"
            className="btn-ghost ml-auto inline-flex items-center gap-2"
            onClick={() => void signOut()}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
