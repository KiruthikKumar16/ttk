import { afterEach, describe, expect, it, vi } from 'vitest'
const logger = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('@/lib/logger', () => ({ logger }))
const sentry = vi.hoisted(() => {
  const setTag = vi.fn()
  const captureException = vi.fn()
  return {
    setTag,
    captureException,
    withScope: vi.fn((callback: (scope: { setTag: typeof setTag }) => unknown) => callback({ setTag })),
  }
})
vi.mock('@sentry/nextjs', () => sentry)
import { serviceUnavailable, unexpectedApiError } from './api-response'
import { AppError } from './http/errors'

afterEach(() => vi.clearAllMocks())

describe('standard API errors', () => {
  it('serializes known application errors with details and request ID', async () => {
    const response = unexpectedApiError(new AppError('No access', 403, 'FORBIDDEN', { resource: 'users' }), 'test')
    expect(response.status).toBe(403)
    expect(response.headers.get('x-request-id')).toBeTruthy()
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'FORBIDDEN', message: 'No access', details: { resource: 'users' } },
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('hides unknown error details while logging safe context', async () => {
    const response = unexpectedApiError(new Error('sensitive database text'), 'student.list')
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toMatchObject({ code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' })
    expect(JSON.stringify(body)).not.toContain('sensitive database text')
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('returns a retryable unavailable response', async () => {
    const response = serviceUnavailable('Storage is down.')
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Storage is down.' },
    })
  })

  it('sends server application errors to Sentry with their request correlation ID', () => {
    const failure = new AppError('Service unavailable.', 503, 'INTERNAL_ERROR')
    const response = unexpectedApiError(failure, 'student.create')
    expect(response.status).toBe(503)
    expect(sentry.captureException).toHaveBeenCalledWith(failure)
    expect(sentry.setTag).toHaveBeenCalledWith('request_id', expect.any(String))
    expect(sentry.setTag).toHaveBeenCalledWith('route', 'student.create')
  })
})
