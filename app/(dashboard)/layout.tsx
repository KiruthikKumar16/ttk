import type { ReactNode } from 'react'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()
  return <DashboardShell role={profile.role}>{children}</DashboardShell>
}
