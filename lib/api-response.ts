import { NextResponse } from 'next/server'

export function unexpectedApiError(error: unknown, context: string) {
  const requestId = crypto.randomUUID()
  console.error(`[${requestId}] ${context}`, error)
  return NextResponse.json(
    { error: 'An unexpected server error occurred.', requestId },
    { status: 500 },
  )
}

export function serviceUnavailable(message = 'The service is temporarily unavailable.') {
  const requestId = crypto.randomUUID()
  return NextResponse.json({ error: message, requestId }, { status: 503 })
}
