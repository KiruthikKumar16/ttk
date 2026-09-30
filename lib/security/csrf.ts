import { NextResponse } from 'next/server'
import { currentRequestId } from '@/lib/observability/request-context'

const KNOWN_ALLOWED_ORIGINS = new Set([
  'https://ttk-lemon.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
])

export function validateMutationRequest(request: Request, contentTypes = ['application/json']) {
  const requestId = currentRequestId()
  let allowed = false
  try {
    const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin
    const origin = request.headers.get('origin')
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()

    if (!origin || !host) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Request rejected.', requestId } },
        { status: 403, headers: { 'x-request-id': requestId } },
      )
    }

    const originUrl = new URL(origin)
    const originString = originUrl.origin
    const requestOrigin = new URL(request.url).origin

    const originMatches =
      originString === appOrigin || originString === requestOrigin || KNOWN_ALLOWED_ORIGINS.has(originString)

    const hostMatches =
      host === new URL(appOrigin).host ||
      host === new URL(request.url).host ||
      host === originUrl.host ||
      host === 'ttk-lemon.vercel.app' ||
      host === 'localhost:3000' ||
      host === '127.0.0.1:3000'

    allowed = originMatches && hostMatches && contentTypes.includes(contentType ?? '')
  } catch {
    allowed = false
  }
  if (allowed) return null
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message: 'Request rejected.', requestId } },
    {
      status: 403,
      headers: { 'x-request-id': requestId },
    },
  )
}
