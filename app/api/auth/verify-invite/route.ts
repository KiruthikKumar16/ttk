import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rate-limit'
import { withApi } from '@/lib/http/handler'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const querySchema = z.object({
  code: z.string().trim().min(1, 'Invite code is required').max(100),
})

async function getVerifyInvite(request: Request, requestId: string) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await rateLimit(`verify-invite:${ip}`, 30, '1 m')
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds), 'x-request-id': requestId } },
      )
    }

    const { searchParams } = new URL(request.url)
    const codeParam = searchParams.get('code')
    const parsed = querySchema.safeParse({ code: codeParam })
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: 'Please provide an invite code.' },
        { status: 400, headers: { 'x-request-id': requestId } },
      )
    }

    const trimmedCode = parsed.data.code.toUpperCase().replace(/\s+/g, '-')
    const expectedStatic = (process.env.STAFF_INVITE_PASSCODE || 'THOORIGAI-STAFF').toUpperCase()

    if (trimmedCode === expectedStatic) {
      return NextResponse.json(
        {
          valid: true,
          role: 'staff',
          type: 'master_passcode',
          recipientEmail: null,
          message: 'Valid master staff access code.',
        },
        { headers: { 'x-request-id': requestId } },
      )
    }

    const adminClient = getSupabaseAdminClient(requestId)
    const { data: invite, error } = await adminClient
      .from('invite_codes')
      .select('id, code, role, recipient_email, expires_at, is_used')
      .ilike('code', trimmedCode)
      .maybeSingle()

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, error: 'Invite code was not found. Please verify the code or request access without one.' },
        { status: 200, headers: { 'x-request-id': requestId } },
      )
    }

    if (invite.is_used) {
      return NextResponse.json(
        { valid: false, error: 'This invite code has already been redeemed. Please request a new code.' },
        { status: 200, headers: { 'x-request-id': requestId } },
      )
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { valid: false, error: 'This invite code has expired. Please contact an administrator for a new code.' },
        { status: 200, headers: { 'x-request-id': requestId } },
      )
    }

    return NextResponse.json(
      {
        valid: true,
        role: invite.role,
        recipientEmail: invite.recipient_email ?? null,
        expiresAt: invite.expires_at,
        message: `Valid ${invite.role.toUpperCase()} invite code.`,
      },
      { headers: { 'x-request-id': requestId } },
    )
  } catch (err: unknown) {
    console.error('[Verify Invite Error]:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { valid: false, error: 'Unable to verify code right now. Please try again.' },
      { status: 500, headers: { 'x-request-id': requestId } },
    )
  }
}

export const GET = withApi({ public: true }, async ({ request, requestId }) => getVerifyInvite(request, requestId))
