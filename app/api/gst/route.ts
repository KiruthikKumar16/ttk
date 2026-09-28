import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { gstSettings } from '@/lib/mock-data'
import { gstSchema } from '@/lib/validation'
import z from 'zod'

export async function GET(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('gst_settings')
      .select('*')
      .limit(1)
      .single()
    if (!error && data) {
      return NextResponse.json({
        data: {
          rate: Number(data.rate),
          gstin: data.gstin ? String(data.gstin) : null,
          enabled: Boolean(data.enabled),
        },
        source: 'supabase',
      })
    }
    return NextResponse.json({ data: { ...gstSettings }, source: 'mock' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch GST settings' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    return new NextResponse(JSON.stringify({ error: 'Unable to fetch user profile' }), { status: 500 })
  }

  // Only admin can update GST settings
  if (profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to update GST settings' }), { status: 403 })
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = gstSchema.parse(body)

    const {
      rate,
      gstin,
      enabled,
    } = parsedBody

    const { data, error } = await supabase
      .from('gst_settings')
      .upsert({ id: 'default', rate, gstin: gstin?.trim() || null, enabled, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error && data) {
      return NextResponse.json({
        data: { rate: Number(data.rate), gstin: data.gstin ? String(data.gstin) : null, enabled: Boolean(data.enabled) },
        message: 'GST settings updated',
        source: 'supabase',
      })
    }

    // Update in-memory
    gstSettings.rate = rate
    gstSettings.gstin = gstin?.trim() || null
    gstSettings.enabled = enabled

    return NextResponse.json({
      data: { ...gstSettings },
      message: 'GST settings updated',
      source: 'mock',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update GST settings' },
      { status: 500 }
    )
  }
}
