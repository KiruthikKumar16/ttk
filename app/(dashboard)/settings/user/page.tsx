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
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>User settings</h1>
          <p className="subcopy">
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
