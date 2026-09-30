import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'
import { can, type Action, type Resource } from '@/lib/auth/permissions'

export type CurrentProfile = { id: string; role: Role; fullName: string }

export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data, error } = await supabase.from('profiles').select('id, role, full_name').eq('id', user.id).maybeSingle()
  if (error || !data || !['admin', 'staff', 'trainer'].includes(data.role)) redirect('/login')

  return { id: user.id, role: data.role as Role, fullName: data.full_name ?? '' }
})

export async function requirePermission(resource: Resource, action: Action): Promise<CurrentProfile> {
  const profile = await getCurrentProfile()
  if (!can(profile.role, resource, action)) redirect('/')
  return profile
}
