import type { ReactNode } from 'react'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()
  if (profile.role === 'admin') {
    const supabase = await createClient()
    const { data: assurance, error } = await supabase.auth.getClaims()
    if (error || assurance?.claims.aal !== 'aal2') redirect('/mfa')
  }
  return <DashboardShell role={profile.role}>{children}</DashboardShell>
}
