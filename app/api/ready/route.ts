import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/security/rate-limit'

const expectedMigration = '20261002120000'
const deadline = <T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Readiness dependency timed out')), timeoutMs)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })

export async function GET(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const headers = { 'x-request-id': requestId, 'Cache-Control': 'no-store, max-age=0' }
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limited = await rateLimit(`readiness:${ip}`, 30, '1 m')
    if (!limited.success) {
      return NextResponse.json(
        { ready: false },
        { status: 429, headers: { ...headers, 'Retry-After': String(limited.retryAfterSeconds) } },
      )
    }

    const supabase = getSupabaseAdminClient(requestId) as unknown as SupabaseClient
    const readiness = await deadline(
      supabase.rpc('get_app_readiness', { p_expected_migration: expectedMigration }),
      3000,
    )
    if (readiness.error) throw readiness.error
    const migration = readiness.data?.[0]
    if (!migration?.migration_matches) throw new Error('Database migration version is not current')

    const storage = await deadline(supabase.storage.listBuckets(), 3000)
    const buckets = new Map((storage.data ?? []).map((bucket) => [bucket.name, bucket.public]))
    if (storage.error || buckets.get('course-materials') !== false || buckets.get('invoice-pdf-cache') !== false) {
      throw new Error('Required private storage bucket is unavailable')
    }

    return NextResponse.json({ ready: true }, { status: 200, headers })
  } catch (error) {
    logger.warn(
      { requestId, route: '/api/ready', errorType: error instanceof Error ? error.name : typeof error },
      'Readiness check failed',
    )
    Sentry.withScope((scope) => {
      scope.setTag('request_id', requestId)
      scope.setTag('route', '/api/ready')
      Sentry.captureException(error)
    })
    return NextResponse.json({ ready: false, requestId }, { status: 503, headers: { ...headers, 'Retry-After': '30' } })
  }
}
