import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { logger, logProductEvent } from './logger'

afterEach(() => vi.restoreAllMocks())

describe('structured product events', () => {
  it('writes an event name, request ID, and safe numeric metadata', () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => logger)
    logProductEvent('payment_recorded', 'trace-42', { status: 201 })
    expect(info).toHaveBeenCalledWith(
      { event: 'payment_recorded', requestId: 'trace-42', status: 201 },
      'Product event',
    )
  })
})
