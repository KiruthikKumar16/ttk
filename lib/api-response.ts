import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { AppError, InternalError } from '@/lib/http/errors'

export function unexpectedApiError(error: unknown, context: string) {
  const requestId = crypto.randomUUID()
  if (error instanceof AppError) {
    return NextResponse.json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
        requestId,
      },
    }, { status: error.status, headers: { 'x-request-id': requestId } })
  }
  logger.error(
    { requestId, context, errorType: error instanceof Error ? error.name : typeof error },
    'Unhandled API error',
  )
  const internalError = new InternalError()
  return NextResponse.json({
    error: { code: internalError.code, message: internalError.message, requestId },
  }, { status: internalError.status, headers: { 'x-request-id': requestId } })
}

export function serviceUnavailable(message = 'The service is temporarily unavailable.') {
  const requestId = crypto.randomUUID()
  return NextResponse.json({
    error: { code: 'SERVICE_UNAVAILABLE', message, requestId },
  }, { status: 503, headers: { 'x-request-id': requestId } })
}
