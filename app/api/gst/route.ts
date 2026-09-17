import { NextResponse } from 'next/server'
import { gstSettings } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('gst_settings')
        .select('*')
        .limit(1)
        .single()
      if (!error && data) {
        return NextResponse.json({
          data: {
            rate: Number(data.rate),
            gstin: String(data.gstin),
            enabled: Boolean(data.enabled),
          },
          source: 'supabase',
        })
      }
    }
    return NextResponse.json({ data: { ...gstSettings }, source: 'mock' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch GST settings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const rate = body.rate !== undefined ? Number(body.rate) : gstSettings.rate
    const gstin = body.gstin !== undefined ? String(body.gstin).trim() : gstSettings.gstin
    const enabled = body.enabled !== undefined ? Boolean(body.enabled) : gstSettings.enabled

    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: 'GST rate must be between 0 and 100.' }, { status: 400 })
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('gst_settings')
        .upsert({ id: 1, rate, gstin, enabled, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (!error && data) {
        return NextResponse.json({
          data: { rate: Number(data.rate), gstin: String(data.gstin), enabled: Boolean(data.enabled) },
          message: 'GST settings updated',
          source: 'supabase',
        })
      }
    }

    // Update in-memory
    gstSettings.rate = rate
    gstSettings.gstin = gstin
    gstSettings.enabled = enabled

    return NextResponse.json({
      data: { ...gstSettings },
      message: 'GST settings updated',
      source: 'mock',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update GST settings' },
      { status: 500 }
    )
  }
}
