import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
}))

vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: class MockRatelimit {
      static slidingWindow = vi.fn()
      limit = mocks.limit
    },
  }
})

vi.mock('@upstash/redis', () => {
  return {
    Redis: class MockRedis {},
  }
})

import { rateLimit } from './rate-limit'

describe('rate limit helper', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('bypasses when Upstash Redis is not configured in dev or test', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const res = await rateLimit('test-ip', 5, '1 m')
    expect(res).toEqual({ success: true, retryAfterSeconds: 0 })
  })

  it('bypasses in Playwright test environment with localhost', async () => {
    vi.stubEnv('PLAYWRIGHT_TEST', '1')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
    const res = await rateLimit('test-ip', 5, '1 m')
    expect(res).toEqual({ success: true, retryAfterSeconds: 0 })
  })

  it('bypasses gracefully with warning in production if redis is unconfigured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await rateLimit('test-ip', 5, '1 m')
    expect(res).toEqual({ success: true, retryAfterSeconds: 0 })
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('calls Upstash limiter when redis is configured', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'secret-token'
    mocks.limit.mockResolvedValueOnce({
      success: true,
      reset: Date.now() + 30000,
    })

    const res = await rateLimit('client-1', 10, '1 m')
    expect(res.success).toBe(true)
    expect(res.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })

  it('handles rate-limited response when limit exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'secret-token'
    mocks.limit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 45000,
    })

    const res = await rateLimit('client-2', 5, '15 m')
    expect(res.success).toBe(false)
    expect(res.retryAfterSeconds).toBeGreaterThan(0)
  })
})
