import { z } from 'zod'
import { withApi } from '@/lib/http/handler'

const updateSettingsSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  contactDetails: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const GET = withApi({ roles: ['admin', 'staff'] }, async ({ supabase, user }) => {
  const { data, error } = await supabase!
    .from('profiles')
    .select('id, full_name, role, created_at, contact_details, metadata')
    .eq('id', user!.id)
    .single()

  if (error) throw error
  return {
    profile: {
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      createdAt: data.created_at,
      contactDetails: (data.contact_details as Record<string, unknown>) ?? {},
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    },
  }
})

export const PATCH = withApi(
  { roles: ['admin', 'staff'], body: updateSettingsSchema },
  async ({ supabase, user, body }) => {
    const updatePayload: Record<string, unknown> = {}
    if (body.fullName !== undefined) {
      updatePayload.full_name = body.fullName.trim()
    }
    if (body.contactDetails !== undefined) {
      updatePayload.contact_details = body.contactDetails
    }
    if (body.metadata !== undefined) {
      updatePayload.metadata = body.metadata
    }

    if (Object.keys(updatePayload).length === 0) {
      return { updated: true }
    }

    const { data, error } = await supabase!
      .from('profiles')
      .update(updatePayload)
      .eq('id', user!.id)
      .select('id, full_name, role, created_at, contact_details, metadata')
      .single()

    if (error) throw error

    return {
      updated: true,
      profile: {
        id: data.id,
        fullName: data.full_name,
        role: data.role,
        createdAt: data.created_at,
        contactDetails: (data.contact_details as Record<string, unknown>) ?? {},
        metadata: (data.metadata as Record<string, unknown>) ?? {},
      },
    }
  },
)
