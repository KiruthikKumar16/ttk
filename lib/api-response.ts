import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { AppError, InternalError } from '@/lib/http/errors'
import * as Sentry from '@sentry/nextjs'
import { currentRequestId, currentRequestUserIdHash } from '@/lib/observability/request-context'

export function unexpectedApiError(error: unknown, context: string) {
  const requestId = currentRequestId()
  if (error instanceof AppError) {
    if (error.status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('request_id', requestId)
        scope.setTag('route', context)
        const userIdHash = currentRequestUserIdHash()
        if (userIdHash) scope.setTag('user_id_hash', userIdHash)
        Sentry.captureException(error)
      })
    }
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
          requestId,
        },
      },
      { status: error.status, headers: { 'x-request-id': requestId } },
    )
  }
  logger.error(
    { requestId, context, errorType: error instanceof Error ? error.name : typeof error },
    'Unhandled API error',
  )
  Sentry.withScope((scope) => {
    scope.setTag('request_id', requestId)
    scope.setTag('route', context)
    const userIdHash = currentRequestUserIdHash()
    if (userIdHash) scope.setTag('user_id_hash', userIdHash)
    Sentry.captureException(error)
  })
  const internalError = new InternalError()
  return NextResponse.json(
    {
      error: { code: internalError.code, message: internalError.message, requestId },
    },
    { status: internalError.status, headers: { 'x-request-id': requestId } },
  )
}

export function serviceUnavailable(message = 'The service is temporarily unavailable.') {
  const requestId = currentRequestId()
  return NextResponse.json(
    {
      error: { code: 'SERVICE_UNAVAILABLE', message, requestId },
    },
    { status: 503, headers: { 'x-request-id': requestId } },
  )
}
