'use client'

import { useState, type ReactNode } from 'react'
import type { Role } from '@/lib/types'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar role={role} collapsed={collapsed} />
      <div className="main-area">
        <Topbar onMenu={() => setCollapsed((v) => !v)} role={role} />
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
