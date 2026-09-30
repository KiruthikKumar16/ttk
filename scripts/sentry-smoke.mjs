import * as Sentry from '@sentry/nextjs'
import { randomUUID } from 'node:crypto'

function scrubEvent(event) {
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
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({ ...breadcrumb, data: undefined }))
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exception) => ({
      ...exception,
      value: exception.type ?? 'Error',
    }))
  }
  return event
}

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
if (!dsn) {
  console.error('Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN in the current environment before running this check.')
  process.exit(1)
}

const requestId = `manual-${randomUUID()}`
Sentry.init({
  dsn,
  environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE ?? process.env.GITHUB_SHA ?? 'local',
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  beforeSend: scrubEvent,
})
Sentry.captureException(new Error('Sentry smoke test'), { tags: { request_id: requestId, source: 'manual-smoke' } })
const flushed = await Sentry.flush(5000)
if (!flushed) throw new Error('Sentry did not flush the smoke-test event before timeout.')
console.log(`Sent sanitized Sentry smoke event. Search the Sentry project for request_id=${requestId}`)
