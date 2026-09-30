import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateMutationRequest } from '@/lib/security/csrf'
import { rateLimit } from '@/lib/security/rate-limit'
import { withApi } from '@/lib/http/handler'
import { logProductEvent } from '@/lib/logger'

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
})

async function postLogin(request: Request, requestId: string) {
  const csrfResponse = validateMutationRequest(request)
  if (csrfResponse) return csrfResponse
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await rateLimit(`login:${ip}`, 5, '15 m')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Unable to sign in. Please try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds), 'x-request-id': requestId },
        },
      )
    }
    const parsed = credentialsSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 400 })
    const supabase = await createClient(requestId)
    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    if (error) {
      logProductEvent('login_failed', requestId)
      return NextResponse.json(
        { error: 'Unable to sign in. Please try again.' },
        {
          status: 401,
          headers: { 'x-request-id': requestId },
        },
      )
    }
    return NextResponse.json({ data: { signedIn: true } }, { headers: { 'x-request-id': requestId } })
  } catch {
    return NextResponse.json(
      { error: 'Unable to sign in. Please try again.' },
      {
        status: 503,
        headers: { 'x-request-id': requestId },
      },
    )
  }
}

export const POST = withApi({ public: true }, async ({ request, requestId }) => postLogin(request, requestId))
