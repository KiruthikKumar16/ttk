export type AppErrorCode =
  'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED' | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: AppErrorCode,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The request is invalid.', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You are not allowed to perform this action.') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with the current resource state.', details?: unknown) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Too many requests.',
    readonly retryAfterSeconds?: number,
  ) {
    super(message, 429, 'RATE_LIMITED', retryAfterSeconds === undefined ? undefined : { retryAfterSeconds })
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected server error occurred.') {
    super(message, 500, 'INTERNAL_ERROR')
  }
}
