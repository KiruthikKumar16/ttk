import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { UserRoles } from '@/modules/shared/components/UserRoles'
import type { Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function UsersSettingsPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = await searchParams
  const profile = await requirePermission('users', 'manage')
  const supabase = await createClient()
  let userRows: Array<{
    id: string
    full_name: string | null
    role: string
    created_at: string | null
    contact_details?: unknown
    metadata?: unknown
  }> = []

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id,full_name,role,created_at,contact_details,metadata')
    .order('full_name')
    .limit(500)

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id,full_name,role,created_at')
      .order('full_name')
      .limit(500)
    if (fallback.error) throw fallback.error
    userRows = fallback.data ?? []
  } else {
    userRows = users ?? []
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--panel)] text-[var(--mute)] border border-[var(--border)]">
              SETTINGS
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Users and roles</h1>
          <p className="text-xs text-[var(--mute)] mt-1">Review app access. Role changes are recorded in the audit log.</p>
        </div>
      </div>
      <UserRoles
        users={userRows.map((user) => ({
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
