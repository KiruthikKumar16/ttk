import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserSettingsView } from '@/modules/settings/components/UserSettingsView'
import type { Role, UserContactDetails, UserMetadata } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function UserSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, contact_details, metadata')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/login')
  }

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
          id: profile.id,
          fullName: profile.full_name || '',
          role: profile.role as Role,
          createdAt: profile.created_at,
          contactDetails: (profile.contact_details as UserContactDetails) || {},
          metadata: (profile.metadata as UserMetadata) || {},
        }}
      />
    </main>
  )
}
