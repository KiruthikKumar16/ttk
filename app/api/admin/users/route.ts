import { z } from 'zod'
import { withApi } from '@/lib/http/handler'

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'staff', 'trainer']),
})

export const GET = withApi({ roles: ['admin'] }, async ({ supabase }) => {
  const { data, error } = await supabase!
    .from('profiles')
    .select('id,full_name,role,created_at')
    .order('full_name')
    .limit(500)
  if (error) throw error
  return data ?? []
})

export const PATCH = withApi({ roles: ['admin'], body: roleSchema }, async ({ supabase, body }) => {
  const { error } = await supabase!.rpc('admin_change_profile_role', {
    p_user_id: body.userId,
    p_role: body.role,
  })
  if (error) {
    if (error.code === 'P0002') return Response.json({ error: 'User profile was not found.' }, { status: 404 })
    if (error.code === '22023' || error.code === '23514')
      return Response.json({ error: error.message }, { status: 409 })
    if (error.code === '42501') return Response.json({ error: 'Admin access with MFA is required.' }, { status: 403 })
    throw error
  }
  return { updated: true }
})
