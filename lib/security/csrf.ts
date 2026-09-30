import { NextResponse } from 'next/server'
import { currentRequestId } from '@/lib/observability/request-context'

export function validateMutationRequest(request: Request, contentTypes = ['application/json']) {
  const requestId = currentRequestId()
  let allowed = false
  try {
    const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin
    const origin = request.headers.get('origin')
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
    allowed =
      Boolean(origin) &&
      new URL(origin!).origin === appOrigin &&
      host === new URL(appOrigin).host &&
      contentTypes.includes(contentType ?? '')
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
