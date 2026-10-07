import { getCurrentProfile } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { UserSettingsView } from '@/modules/settings/components/UserSettingsView'
import type { Role, UserContactDetails, UserMetadata } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function UserSettingsPage() {
  const current = await getCurrentProfile()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, contact_details, metadata')
    .eq('id', current.id)
    .maybeSingle()

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--panel)] text-[var(--mute)] border border-[var(--border)]">
              SETTINGS
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">User settings</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Manage your contact details, communication channels, and custom metadata attributes.
          </p>
        </div>
      </div>
      <UserSettingsView
        initialProfile={{
          id: current.id,
          fullName: profile?.full_name ?? current.fullName ?? '',
          role: (profile?.role as Role) || current.role,
          createdAt: profile?.created_at ?? new Date().toISOString(),
          contactDetails: (profile?.contact_details as UserContactDetails) || {},
          metadata: (profile?.metadata as UserMetadata) || {},
        }}
      />
    </main>
  )
}
