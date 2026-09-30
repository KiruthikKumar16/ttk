import * as Sentry from '@sentry/nextjs'
import type { Instrumentation } from 'next'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config')
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config')
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const headers = request.headers
  const rawRequestId = headers['x-request-id']
  const requestId = Array.isArray(rawRequestId) ? (rawRequestId[0] ?? 'unavailable') : (rawRequestId ?? 'unavailable')
  await Sentry.withScope(async (scope) => {
    scope.setTag('request_id', requestId)
    scope.setTag('route', context.routePath)
    scope.setTag('route_type', context.routeType)
    await Sentry.captureException(error)
  })
}
