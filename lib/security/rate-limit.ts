import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redisLimiters = new Map<string, Ratelimit>()

export async function rateLimit(identifier: string, limit: number, duration: '1 m' | '15 m') {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    const supabaseHost = (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
      } catch {
        return ''
      }
    })()
    if (process.env.PLAYWRIGHT_TEST === '1' && ['127.0.0.1', 'localhost', '::1'].includes(supabaseHost)) {
      return { success: true, retryAfterSeconds: 0 }
    }
    if (process.env.NODE_ENV !== 'production') return { success: true, retryAfterSeconds: 0 }
    throw new Error('Rate limiting is not configured.')
  }

  const limiterKey = `${duration}:${limit}`
  let limiter = redisLimiters.get(limiterKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, duration),
      prefix: 'thoorigai:ratelimit',
    })
    redisLimiters.set(limiterKey, limiter)
  }
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
  }
}
