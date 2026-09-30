import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('environment validation', () => {
  it('reports every invalid public variable with actionable names', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'bad-url')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_VERIFY_BASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    await expect(import('./env')).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/s)
  })

  it('parses valid public values and requires the server-only service role key lazily', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-demo-key')
    vi.stubEnv('NEXT_PUBLIC_VERIFY_BASE_URL', 'https://verify.example.test')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const client = await import('./env')
    expect(client.clientEnv.NEXT_PUBLIC_APP_URL).toBe('https://app.example.test')
    const server = await import('./env.server')
    expect(() => server.getServerEnv()).toThrow('SUPABASE_SERVICE_ROLE_KEY is required')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-only-test-key')
    expect(server.getServerEnv()).toEqual({ SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key' })
  })
})
