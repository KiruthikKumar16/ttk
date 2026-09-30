import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gstSchema } from '@/lib/validation'
import { unexpectedApiError } from '@/lib/api-response'
import z from 'zod'
import { validateMutationRequest } from '@/lib/security/csrf'
import { withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { revalidateTag } from 'next/cache'

async function getGstSettings() {
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()
  if (currentProfile?.role !== 'admin' && currentProfile?.role !== 'staff')
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  try {
    const { data, error } = await supabase.from('gst_settings').select('*').limit(1).maybeSingle()
    if (error) throw error
    return NextResponse.json({
      data: data
        ? {
            rate: Number(data.rate),
            gstin: data.gstin ? String(data.gstin) : null,
            enabled: Boolean(data.enabled),
          }
        : null,
    })
  } catch (error) {
    return unexpectedApiError(error, 'Failed to fetch GST settings')
  }
}

async function updateGstSettings(req: NextRequest) {
  const rejected = validateMutationRequest(req)
  if (rejected) return rejected
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch the user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (profileError || !profile) {
    return unexpectedApiError(
      profileError ?? new Error('User profile was not found.'),
      'Unable to fetch GST editor profile',
    )
  }

  // Only admin can update GST settings
  if (profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to update GST settings' }), {
      status: 403,
    })
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = gstSchema.parse(body)

    const { rate, gstin, enabled } = parsedBody

    const { data, error } = await supabase
      .from('gst_settings')
      .upsert({ id: 'default', rate, gstin: gstin?.trim() || null, enabled, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error || !data) throw error ?? new Error('No GST settings row was returned after save.')
    revalidateTag('gst-settings', { expire: 0 })
    return NextResponse.json({
      data: {
        rate: Number(data.rate),
        gstin: data.gstin ? String(data.gstin) : null,
        enabled: Boolean(data.enabled),
      },
      message: 'GST settings updated',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Failed to update GST settings')
  }
}

export const GET = withApi({ roles: rolesFor('gst', 'read') }, async () => getGstSettings())
export const POST = withApi({ roles: ['admin'] as const }, async ({ request }) =>
  updateGstSettings(request as NextRequest),
)
