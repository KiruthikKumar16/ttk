import { z } from 'zod'
import { withApi } from '@/lib/http/handler'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'staff', 'pending']).optional(),
  fullName: z.string().min(1).max(200).optional(),
  contactDetails: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const createUserSchema = z.object({
  email: z.string().email().max(254),
  fullName: z.string().min(1).max(200),
  role: z.enum(['admin', 'staff', 'pending']).default('staff'),
  password: z.string().min(8).max(1024).optional(),
  contactDetails: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const GET = withApi({ roles: ['admin'] }, async ({ supabase }) => {
  const { data, error } = await supabase!
    .from('profiles')
    .select('id,full_name,role,created_at,contact_details,metadata')
    .order('full_name')
    .limit(500)
  if (error) throw error
  return data ?? []
})

export const PATCH = withApi({ roles: ['admin'], body: updateUserSchema }, async ({ supabase, body }) => {
  if (body.role) {
    const { error } = await supabase!.rpc('admin_change_profile_role', {
      p_user_id: body.userId,
      p_role: body.role,
    })
    if (error) {
      if (error.code === 'P0002') return Response.json({ error: 'User profile was not found.' }, { status: 404 })
      if (error.code === '22023' || error.code === '23514')
        return Response.json({ error: error.message }, { status: 409 })
      if (error.code === '42501') return Response.json({ error: 'Admin access required.' }, { status: 403 })
      throw error
    }
  }

  const profileUpdates: Record<string, unknown> = {}
  if (body.fullName !== undefined) profileUpdates.full_name = body.fullName.trim()
  if (body.contactDetails !== undefined) profileUpdates.contact_details = body.contactDetails
  if (body.metadata !== undefined) profileUpdates.metadata = body.metadata

  if (Object.keys(profileUpdates).length > 0) {
    const { error: updateError } = await supabase!.from('profiles').update(profileUpdates).eq('id', body.userId)

    if (updateError) throw updateError
  }

  return { updated: true }
})

export const POST = withApi({ roles: ['admin'], body: createUserSchema }, async ({ body, requestId }) => {
  const adminClient = getSupabaseAdminClient(requestId)

  if (body.password) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.fullName },
      app_metadata: { role: body.role },
    })
    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    if (data.user) {
      await adminClient.from('profiles').upsert({
        id: data.user.id,
        role: body.role,
        full_name: body.fullName,
      })
    }
    return { created: true, user: { id: data.user?.id, email: data.user?.email } }
  }

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(body.email, {
    data: { full_name: body.fullName },
  })
  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
  if (data.user) {
    await adminClient.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role: body.role },
    })
    await adminClient.from('profiles').upsert({
      id: data.user.id,
      role: body.role,
      full_name: body.fullName,
    })
  }
  return { invited: true, user: { id: data.user?.id, email: data.user?.email } }
})
