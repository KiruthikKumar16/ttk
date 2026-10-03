import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { UserRoles } from '@/modules/shared/components/UserRoles'
import type { Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function UsersSettingsPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = await searchParams
  const profile = await requirePermission('users', 'manage')
  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id,full_name,role,created_at,contact_details,metadata')
    .order('full_name')
    .limit(500)
  if (error) throw error

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Users and roles</h1>
          <p className="subcopy">Review app access. Role changes are recorded in the audit log.</p>
        </div>
      </div>
      <UserRoles
        users={(users ?? []).map((user) => ({
          id: String(user.id),
          full_name: user.full_name,
          role: user.role as Role,
          created_at: user.created_at,
          contact_details: (user.contact_details as any) || {},
          metadata: (user.metadata as any) || {},
        }))}
        currentUserId={profile.id}
        initialFilter={params?.filter}
      />
    </main>
  )
}
