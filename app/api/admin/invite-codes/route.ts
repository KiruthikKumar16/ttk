import { z } from 'zod'
import { withApi } from '@/lib/http/handler'
import { ValidationError } from '@/lib/http/errors'

const createInviteSchema = z.object({
  role: z.enum(['staff', 'admin']).default('staff'),
  expiresInHours: z.number().int().min(1).max(720).default(24),
  recipientEmail: z.string().email().max(254).optional().nullable(),
})

const deleteInviteSchema = z.object({
  id: z.string().uuid(),
})

function generateRandomCode(role: 'staff' | 'admin'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const prefix = role === 'admin' ? 'ADMIN' : 'STAFF'
  const randomBytes = crypto.getRandomValues(new Uint8Array(8))
  const part1 = Array.from(randomBytes.slice(0, 4))
    .map((b) => chars[b % chars.length])
    .join('')
  const part2 = Array.from(randomBytes.slice(4, 8))
    .map((b) => chars[b % chars.length])
    .join('')
  return `${prefix}-${part1}-${part2}`
}

export const GET = withApi({ roles: ['admin'] }, async ({ supabase }) => {
  const { data: codes, error } = await supabase!
    .from('invite_codes')
    .select('id,code,role,recipient_email,expires_at,is_used,used_at,created_at,created_by,used_by_user_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !codes) {
    return []
  }

  const userIds = Array.from(
    new Set(codes.flatMap((c) => [c.created_by, c.used_by_user_id]).filter((id): id is string => Boolean(id))),
  )

  let nameMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase!.from('profiles').select('id, full_name').in('id', userIds)

    if (profiles) {
      nameMap = new Map(profiles.map((p) => [p.id, p.full_name || '']))
    }
  }

  return codes.map((row) => ({
    id: row.id,
    code: row.code,
    role: row.role,
    recipientEmail: row.recipient_email,
    expiresAt: row.expires_at,
    isUsed: row.is_used,
    usedAt: row.used_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByName: row.created_by ? (nameMap.get(row.created_by) ?? null) : null,
    usedByUserId: row.used_by_user_id,
    usedByUserName: row.used_by_user_id ? (nameMap.get(row.used_by_user_id) ?? null) : null,
  }))
})

export const POST = withApi({ roles: ['admin'], body: createInviteSchema }, async ({ supabase, user, body }) => {
  const code = generateRandomCode(body.role)
  const expiresAt = new Date(Date.now() + body.expiresInHours * 3600 * 1000).toISOString()

  const { data, error } = await supabase!
    .from('invite_codes')
    .insert({
      code,
      role: body.role,
      created_by: user!.id,
      recipient_email: body.recipientEmail ? body.recipientEmail.toLowerCase().trim() : null,
      expires_at: expiresAt,
      is_used: false,
    })
    .select('id,code,role,recipient_email,expires_at,is_used,created_at')
    .single()

  if (error) {
    throw new ValidationError(error.message)
  }

  return {
    created: true,
    invite: {
      id: data.id,
      code: data.code,
      role: data.role,
      recipientEmail: data.recipient_email,
      expiresAt: data.expires_at,
      isUsed: data.is_used,
      createdAt: data.created_at,
    },
  }
})

export const DELETE = withApi(
  {
    roles: ['admin'],
    query: deleteInviteSchema,
    mutationContentTypes: ['application/json', ''],
  },
  async ({ supabase, query }) => {
    const { error } = await supabase!.from('invite_codes').delete().eq('id', query.id).eq('is_used', false)

    if (error) {
      throw new ValidationError(error.message)
    }

    return { deleted: true }
  },
)
