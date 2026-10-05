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
    const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data)
    if (error) {
      console.error('[Login Failed]:', error.message, 'for email:', parsed.data.email)
      logProductEvent('login_failed', requestId)
      return NextResponse.json(
        { error: error.message || 'Unable to sign in. Please try again.' },
        {
          status: 401,
          headers: { 'x-request-id': requestId },
        },
      )
    }
    if (authData?.user) {
      // Query profiles table via adminClient to avoid RLS limitations and stale JWT claims
      const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = getSupabaseAdminClient(requestId)
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()

      const currentRole = profile?.role || (authData.user.app_metadata?.role as string | undefined)?.toLowerCase()

      // If user's profile is still pending, block access
      if (currentRole === 'pending') {
        await supabase.auth.signOut()
        return NextResponse.json(
          {
            error: 'Your account is pending administrator approval. Please contact your academy administrator.',
            code: 'ACCOUNT_PENDING_APPROVAL',
          },
          { status: 403, headers: { 'x-request-id': requestId } },
        )
      }

      // If user is active in profiles (admin or staff), ensure app_metadata is synchronized
      const metaRole = (authData.user.app_metadata?.role as string | undefined)?.toLowerCase()
      if (profile?.role && profile.role !== metaRole && (profile.role === 'admin' || profile.role === 'staff')) {
        await adminClient.auth.admin
          .updateUserById(authData.user.id, {
            app_metadata: { role: profile.role },
          })
          .catch(() => {})
      }
    }

    return NextResponse.json({ data: { signedIn: true } }, { headers: { 'x-request-id': requestId } })
  } catch (err: any) {
    console.error('[Login Catch Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Unable to sign in. Please try again.' },
      {
        status: 500,
        headers: { 'x-request-id': requestId },
      },
    )
  }
}

export const POST = withApi({ public: true }, async ({ request, requestId }) => postLogin(request, requestId))
