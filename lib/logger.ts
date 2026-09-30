import 'server-only'
import pino from 'pino'

const redactPaths = [
  'phone',
  '*.phone',
  '**.phone',
  'name',
  '*.name',
  '**.name',
  'full_name',
  '*.full_name',
  '**.full_name',
  'email',
  '*.email',
  '**.email',
  'address',
  '*.address',
  '**.address',
  'gstin',
  '*.gstin',
  '**.gstin',
  'dob',
  '*.dob',
  '**.dob',
  'authorization',
  '*.authorization',
  '**.authorization',
  'headers.authorization',
  'req.headers.authorization',
  'request.headers.authorization',
  'req.headers.cookie',
  'request.headers.cookie',
  '*.password',
  '**.password',
  '*.token',
  '**.token',
  '*.secret',
  '**.secret',
  '*.verification_code',
  '**.verification_code',
]

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
})

export type ProductEvent =
  | 'payment_recorded'
  | 'payment_failed'
  | 'invoice_generated'
  | 'certificate_issued'
  | 'verification_hit'
  | 'login_failed'
  | 'storage_error'
  | 'verification_rate_limited'

export function logProductEvent(
  event: ProductEvent,
  requestId: string,
  fields: Record<string, string | number | boolean> = {},
) {
  logger.info({ event, requestId, ...fields }, 'Product event')
}
