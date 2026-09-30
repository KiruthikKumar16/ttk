import { afterEach, describe, expect, it, vi } from 'vitest'

const captureException = vi.hoisted(() => vi.fn())
const setTag = vi.hoisted(() => vi.fn())
vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({
  captureException,
  withScope: (callback: (scope: { setTag: typeof setTag }) => void) => callback({ setTag }),
}))
import { captureError } from './errorReporting'

afterEach(() => {
  vi.restoreAllMocks()
  captureException.mockReset()
  setTag.mockReset()
})

describe('Sentry error reporting', () => {
  it('captures the exception with only an allowlist of safe context tags', async () => {
    const error = new Error('private detail')
    await captureError(error, {
      requestId: 'req-1',
      operation: 'student.create',
      table: 'students',
      phone: 'private',
    })
    expect(captureException).toHaveBeenCalledWith(error)
    expect(setTag.mock.calls).toEqual([
      ['requestId', 'req-1'],
      ['operation', 'student.create'],
      ['table', 'students'],
      ['error_type', 'Error'],
    ])
  })

  it('captures primitive values without throwing', async () => {
    await expect(captureError('failed')).resolves.toBeUndefined()
    expect(captureException).toHaveBeenCalledWith('failed')
  })
})
