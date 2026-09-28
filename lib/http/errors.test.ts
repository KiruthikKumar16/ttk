import { describe, expect, it } from 'vitest'
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from './errors'

describe('AppError hierarchy', () => {
  it.each([
    [new ValidationError(), 400, 'VALIDATION_ERROR'],
    [new UnauthorizedError(), 401, 'UNAUTHORIZED'],
    [new ForbiddenError(), 403, 'FORBIDDEN'],
    [new NotFoundError(), 404, 'NOT_FOUND'],
    [new ConflictError(), 409, 'CONFLICT'],
    [new RateLimitError(), 429, 'RATE_LIMITED'],
    [new InternalError(), 500, 'INTERNAL_ERROR'],
  ])('maps %s to stable HTTP status and code', (error, status, code) => {
    expect(error).toBeInstanceOf(AppError)
    expect(error.status).toBe(status)
    expect(error.code).toBe(code)
    expect(error.name).not.toBe('Error')
  })

  it('keeps structured validation/conflict details and retry guidance', () => {
    const details = [{ path: 'name', message: 'Required' }]
    expect(new ValidationError('Invalid input.', details).details).toEqual(details)
    expect(new ConflictError('Already exists.', { id: 'abc' }).details).toEqual({ id: 'abc' })
    expect(new RateLimitError('Slow down.', 15).retryAfterSeconds).toBe(15)
  })
})
