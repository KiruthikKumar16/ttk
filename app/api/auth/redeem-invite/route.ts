import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateMutationRequest } from '@/lib/security/csrf'
import { rateLimit } from '@/lib/security/rate-limit'
import { withApi } from '@/lib/http/handler'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

const redeemSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(254),
  password: z.string().min(1, 'Password is required').max(1024),
  code: z.string().trim().min(1, 'Invite code or OTP is required').max(100),
})

async function postRedeemInvite(request: Request, requestId: string) {
  const csrfResponse = validateMutationRequest(request)
  if (csrfResponse) return csrfResponse

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await rateLimit(`redeem-invite:${ip}`, 5, '15 m')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds), 'x-request-id': requestId } },
      )
    }

    const json = await request.json().catch(() => null)
    const parsed = redeemSchema.safeParse(json)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid form values.'
      return NextResponse.json({ error: firstError }, { status: 400, headers: { 'x-request-id': requestId } })
    }

    const { email, password, code } = parsed.data
    const trimmedCode = code.toUpperCase().replace(/\s+/g, '-')

    // 1. Verify user credentials
    const supabase = await createClient(requestId)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Incorrect email or password. Please verify your credentials.' },
        { status: 401, headers: { 'x-request-id': requestId } },
      )
    }

    const userId = authData.user.id
    const adminClient = getSupabaseAdminClient(requestId)

    // 2. Check current profile role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404, headers: { 'x-request-id': requestId } },
      )
    }

    // 2. Validate invite code / OTP first to determine target role
    let targetRole: 'admin' | 'staff' = 'staff'
    let inviteId: string | null = null

    const expectedStatic = (process.env.STAFF_INVITE_PASSCODE || 'THOORIGAI-STAFF').toUpperCase()
    if (trimmedCode === expectedStatic) {
      targetRole = 'staff'
    } else {
      const { data: invite, error: inviteErr } = await adminClient
        .from('invite_codes')
        .select('id, code, role, recipient_email, expires_at, is_used')
        .ilike('code', trimmedCode)
        .maybeSingle()

      if (inviteErr || !invite) {
        return NextResponse.json(
          { error: 'Invalid invite code or OTP. Please check the code.' },
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
          { error: 'This invite code has expired. Please contact an administrator for a new code.' },
          { status: 400, headers: { 'x-request-id': requestId } },
        )
      }

      if (invite.recipient_email && invite.recipient_email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        return NextResponse.json(
          { error: `This invite code is reserved for ${invite.recipient_email}.` },
          { status: 400, headers: { 'x-request-id': requestId } },
        )
      }

      targetRole = invite.role as 'admin' | 'staff'
      inviteId = invite.id
    }

    // 3. Check current profile role and eligibility
    if (profile.role === targetRole || (profile.role === 'admin' && targetRole === 'staff')) {
      return NextResponse.json(
        {
          data: {
            role: profile.role,
            alreadyActive: true,
            message: `Your account is already active with the ${profile.role.toUpperCase()} role. You can sign in directly.`,
          },
        },
        { status: 200, headers: { 'x-request-id': requestId } },
      )
    }

    // 4. Activate or upgrade the account
    await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { role: targetRole },
    })

    const { error: updateErr } = await adminClient.from('profiles').update({ role: targetRole }).eq('id', userId)

    if (updateErr) {
      logger.error({ requestId, error: updateErr, userId }, 'Failed to update profile during code redemption')
      return NextResponse.json(
        { error: 'Failed to update user profile. Please contact an administrator.' },
        { status: 500, headers: { 'x-request-id': requestId } },
      )
    }

    // 5. Mark invite code as used
    if (inviteId) {
      await adminClient
        .from('invite_codes')
        .update({
          is_used: true,
          used_by_user_id: userId,
          used_at: new Date().toISOString(),
        })
        .eq('id', inviteId)
    }

    logger.info({ requestId, role: targetRole, userId }, 'Account successfully activated via invite code')

    // Clear the temporary sign-in cookie used for credential verification
    await supabase.auth.signOut().catch(() => {})

    return NextResponse.json(
      {
        data: {
          activated: true,
          role: targetRole,
          message: `Account activated successfully as ${targetRole.toUpperCase()}! You can now access your dashboard.`,
        },
      },
      { status: 200, headers: { 'x-request-id': requestId } },
    )
  } catch (err: unknown) {
    console.error('[Redeem Catch Error]:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Unable to activate account. Please try again.' },
      { status: 500, headers: { 'x-request-id': requestId } },
    )
  }
}

export const POST = withApi({ public: true }, async ({ request, requestId }) => postRedeemInvite(request, requestId))
