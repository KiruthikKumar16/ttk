import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { logger, logProductEvent } from '@/lib/logger'
import { withApi } from '@/lib/http/handler'
import { z } from 'zod'

const invalid = {
  status: 'Invalid',
  document_type: null,
  student_name: null,
  course_name: null,
  issue_date: null,
  invoice_number: null,
}

async function verifyDocument(requestId: string, code: string) {
  const headers = {
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow',
    'x-request-id': requestId,
  }
  try {
    if (!code || code.length > 128) return NextResponse.json({ data: invalid }, { headers })
    const supabase = await createClient(requestId)
    const { data, error } = await supabase.rpc('public_verify_document', { p_code: code })
    if (error) throw error
    logProductEvent('verification_hit', requestId, { valid: data?.[0]?.status === 'Valid' })
    return NextResponse.json({ data: data?.[0] ?? invalid }, { headers })
  } catch (error) {
    logger.error(
      { requestId, errorType: error instanceof Error ? error.name : typeof error },
      'Document verification failed',
    )
    Sentry.captureException(error, { tags: { request_id: requestId, route: '/api/verify/[code]' } })
    return NextResponse.json({ data: invalid }, { headers })
  }
}

export const GET = withApi({ public: true, params: z.object({ code: z.string() }) }, async ({ params, requestId }) =>
  verifyDocument(requestId, params.code),
)
