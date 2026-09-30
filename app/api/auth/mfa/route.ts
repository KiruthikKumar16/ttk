import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateMutationRequest } from '@/lib/security/csrf'
import { rateLimit } from '@/lib/security/rate-limit'
import { withApi } from '@/lib/http/handler'
import { currentRequestId } from '@/lib/observability/request-context'

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('enroll') }),
  z.object({ action: z.literal('verify'), factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }),
])

async function adminClient() {
  const supabase = await createClient(currentRequestId())
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { response: NextResponse.json({ error: 'Authentication is required.' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return { response: NextResponse.json({ error: 'Access denied.' }, { status: 403 }) }
  return { supabase, user }
}

async function getMfaSettings() {
  const result = await adminClient()
  if ('response' in result) return result.response
  const { data, error } = await result.supabase.auth.mfa.listFactors()
  if (error) return NextResponse.json({ error: 'Unable to load MFA settings.' }, { status: 503 })
  return NextResponse.json({ factors: data.all.map(({ id, status }) => ({ id, status })) })
}

async function updateMfaSettings(request: Request) {
  const rejected = validateMutationRequest(request)
  if (rejected) return rejected
  const requestId = currentRequestId()
  try {
    const result = await adminClient()
    if ('response' in result) return result.response
    const limit = await rateLimit(`mfa:${result.user.id}`, 5, '15 m')
    if (!limit.success)
      return NextResponse.json(
        { error: 'Too many requests.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds), 'x-request-id': requestId },
        },
      )
    const parsed = actionSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'The request is invalid.' }, { status: 400 })

    if (parsed.data.action === 'enroll') {
      const { data, error } = await result.supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'ThoorigAI admin authenticator',
      })
      if (error) throw error
      return NextResponse.json(
        {
          factorId: data.id,
          qrCode: `data:image/svg+xml;utf8,${encodeURIComponent(data.totp.qr_code)}`,
          secret: data.totp.secret,
        },
        { headers: { 'x-request-id': requestId } },
      )
    }

    const { data: challenge, error: challengeError } = await result.supabase.auth.mfa.challenge({
      factorId: parsed.data.factorId,
    })
    if (challengeError) throw challengeError
    const { error: verifyError } = await result.supabase.auth.mfa.verify({
      factorId: parsed.data.factorId,
      challengeId: challenge.id,
      code: parsed.data.code,
    })
    if (verifyError)
      return NextResponse.json({ error: 'The authentication code could not be verified.' }, { status: 401 })
    return NextResponse.json({ verified: true }, { headers: { 'x-request-id': requestId } })
  } catch {
    return NextResponse.json(
      { error: 'Unable to update MFA settings.' },
      {
        status: 503,
        headers: { 'x-request-id': requestId },
      },
    )
  }
}

export const GET = withApi({ roles: ['admin'], allowAdminAal1: true }, async () => getMfaSettings())
export const POST = withApi({ roles: ['admin'], allowAdminAal1: true }, async ({ request }) =>
  updateMfaSettings(request),
)
