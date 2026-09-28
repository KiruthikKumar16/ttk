import { NextResponse } from 'next/server'
import { brand } from '@/lib/brand'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: `${brand.shortName.toLowerCase()}-admin-dashboard`,
    mode: 'serverless-ready',
    timestamp: new Date().toISOString(),
  })
}
