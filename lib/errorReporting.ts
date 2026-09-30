import 'server-only'
import * as Sentry from '@sentry/nextjs'

/**
 * Sends an operational error to Sentry without persisting duplicate error records in the business database.
 * @param error The error object (can be any value)
 * @param context Optional additional context to store with the error
 */
export async function captureError(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  const errorType = error instanceof Error ? error.name : typeof error
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(([key]) => ['requestId', 'operation', 'table', 'route'].includes(key)),
  )
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(safeContext)) scope.setTag(key, String(value))
    scope.setTag('error_type', errorType)
    Sentry.captureException(error)
  })
}
