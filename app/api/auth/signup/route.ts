import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateMutationRequest } from '@/lib/security/csrf'
import { rateLimit } from '@/lib/security/rate-limit'
import { withApi } from '@/lib/http/handler'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(1024),
  passcode: z.string().trim().optional(),
})

async function postSignup(request: Request, requestId: string) {
  const csrfResponse = validateMutationRequest(request)
  if (csrfResponse) return csrfResponse

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await rateLimit(`signup:${ip}`, 5, '15 m')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds), 'x-request-id': requestId },
        },
      )
    }

    const json = await request.json().catch(() => null)
    const parsed = signupSchema.safeParse(json)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid form values.'
      return NextResponse.json({ error: firstError }, { status: 400, headers: { 'x-request-id': requestId } })
    }

    const { fullName, email, password, passcode } = parsed.data
    let assignedRole: 'staff' | 'admin' | 'pending' = 'pending'
    let validInviteId: string | null = null

    if (passcode && passcode.trim()) {
      const trimmedCode = passcode.trim().toUpperCase()
      const expectedStatic = (process.env.STAFF_INVITE_PASSCODE || 'THOORIGAI-STAFF').toUpperCase()

      if (trimmedCode === expectedStatic) {
        assignedRole = 'staff'
      } else {
        const adminClient = getSupabaseAdminClient(requestId)
        const { data: invite } = await adminClient
          .from('invite_codes')
          .select('id, role, recipient_email, expires_at, is_used')
          .ilike('code', trimmedCode)
          .maybeSingle()

        if (!invite) {
          return NextResponse.json(
            { error: 'Invalid invite code. Please check the code or leave it blank to request access.' },
            { status: 400, headers: { 'x-request-id': requestId } },
          )
        }
        if (invite.is_used) {
          return NextResponse.json(
            { error: 'This invite code has already been redeemed. Please request a new code.' },
            { status: 400, headers: { 'x-request-id': requestId } },
          )
        }
        if (new Date(invite.expires_at).getTime() < Date.now()) {
          return NextResponse.json(
            { error: 'This invite code has expired. Please ask your administrator to generate a new code.' },
            { status: 400, headers: { 'x-request-id': requestId } },
          )
        }
        if (invite.recipient_email && invite.recipient_email.toLowerCase() !== email.toLowerCase().trim()) {
          return NextResponse.json(
            { error: `This invite code is reserved for ${invite.recipient_email}.` },
            { status: 400, headers: { 'x-request-id': requestId } },
          )
        }

        assignedRole = invite.role as 'staff' | 'admin'
        validInviteId = invite.id
      }
    }

    const adminClient = getSupabaseAdminClient(requestId)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { role: assignedRole },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists') || msg.includes('unique')) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in instead.' },
          { status: 400, headers: { 'x-request-id': requestId } },
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 400, headers: { 'x-request-id': requestId } })
    }

    if (authData?.user) {
      await adminClient.from('profiles').upsert({
        id: authData.user.id,
        role: assignedRole,
        full_name: fullName,
      })

      if (validInviteId) {
        await adminClient
          .from('invite_codes')
          .update({
            is_used: true,
            used_by_user_id: authData.user.id,
            used_at: new Date().toISOString(),
          })
          .eq('id', validInviteId)
      }
    }

    logger.info({ requestId, role: assignedRole, userId: authData?.user?.id }, 'User registered')

    return NextResponse.json(
      {
        data: {
          userId: authData.user.id,
          role: assignedRole,
          status: assignedRole === 'pending' ? 'pending_approval' : 'active',
          message:
            assignedRole === 'pending'
              ? 'Registration submitted. Your account is waiting for administrator approval.'
              : 'Account verified and ready. You can now sign in.',
        },
      },
      { status: 201, headers: { 'x-request-id': requestId } },
    )
  } catch (err: any) {
    console.error('[Signup Catch Error]:', err?.message || err)
    return NextResponse.json(
      { error: 'Unable to complete registration. Please try again.' },
      { status: 500, headers: { 'x-request-id': requestId } },
    )
  }
}

export const POST = withApi({ public: true }, async ({ request, requestId }) => postSignup(request, requestId))
