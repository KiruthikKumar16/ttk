import 'server-only'
import pino from 'pino'

const redactPaths = [
  'phone', '*.phone', '**.phone',
  'email', '*.email', '**.email',
  'dob', '*.dob', '**.dob',
  'authorization', '*.authorization', '**.authorization',
  'headers.authorization', 'req.headers.authorization', 'request.headers.authorization',
]

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
})
