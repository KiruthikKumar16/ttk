import { describe, expect, it } from 'vitest'
import { scrubSentryEvent } from './scrub-sentry-event'

describe('scrubSentryEvent', () => {
  it('removes user identifiers, request data, headers, query strings, breadcrumbs and exception messages', () => {
    const event = scrubSentryEvent({
      event_id: 'event-1',
      user: { id: 'student-id', email: 'student@example.test' },
      extra: { phone: 'private' },
      request: {
        url: 'https://app.example.test/api/verify/private-code?email=student@example.test',
        query_string: 'email=student@example.test',
        data: { password: 'private' },
        cookies: { session: 'private' },
        headers: { authorization: 'Bearer private' },
      },
      breadcrumbs: [{ message: 'request', data: { email: 'student@example.test' } }],
      exception: { values: [{ type: 'DatabaseError', value: 'student@example.test' }] },
    })

    expect(event.user).toBeUndefined()
    expect(event.extra).toBeUndefined()
    expect(event.request).toMatchObject({ headers: {} })
    expect(event.request).not.toHaveProperty('url')
    expect(event.request).not.toHaveProperty('data')
    expect(event.breadcrumbs?.[0]).toMatchObject({ message: 'request', data: undefined })
    expect(event.exception?.values?.[0]).toMatchObject({ type: 'DatabaseError', value: 'DatabaseError' })
  })
})
