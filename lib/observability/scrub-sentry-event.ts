import type { Event } from '@sentry/nextjs'

export function scrubSentryEvent<T extends Event>(event: T): T {
  delete event.user
  delete event.extra
  if (event.request) {
    delete event.request.url
    delete event.request.query_string
    delete event.request.data
    delete event.request.cookies
    delete event.request.env
    event.request.headers = {}
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({ ...breadcrumb, data: undefined }))
  }
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exception) => ({
      ...exception,
      value: exception.type ?? 'Error',
    }))
  }
  return event
}
