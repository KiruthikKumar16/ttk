import { NextResponse } from 'next/server'
import { brand } from '@/lib/brand'
import { withApi } from '@/lib/http/handler'
import packageJson from '../../../package.json'

export const GET = withApi({ public: true }, async () =>
  NextResponse.json({
    ok: true,
    service: `${brand.shortName.toLowerCase()}-admin-dashboard`,
    version: packageJson.version,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'unknown',
    timestamp: new Date().toISOString(),
  }),
)
