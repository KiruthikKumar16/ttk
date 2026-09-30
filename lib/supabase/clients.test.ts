import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(() => 'browser-client'),
  createAdminClient: vi.fn(),
  cookies: vi.fn(),
  getServerEnv: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: mocks.createServerClient,
  createBrowserClient: mocks.createBrowserClient,
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createAdminClient }))
vi.mock('next/headers', () => ({ cookies: mocks.cookies }))
vi.mock('@/lib/env', () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable',
  },
}))
vi.mock('@/lib/env.server', () => ({ getServerEnv: mocks.getServerEnv }))

import { createClient } from './server'
import { getSupabaseAdminClient } from './admin'

describe('Supabase clients', () => {
  it('creates a server client backed by async cookies and tolerates read-only cookie writes', async () => {
    const store = { getAll: vi.fn(() => [{ name: 'session', value: 'x' }]), set: vi.fn() }
    mocks.cookies.mockResolvedValue(store)
    mocks.createServerClient.mockReturnValue({ auth: {} })
    await expect(createClient()).resolves.toEqual({ auth: {} })
    const options = mocks.createServerClient.mock.calls.at(-1)?.[2]
    expect(options.cookies.getAll()).toEqual([{ name: 'session', value: 'x' }])
    options.cookies.setAll([{ name: 'session', value: 'next', options: { httpOnly: true } }])
    expect(store.set).toHaveBeenCalledWith('session', 'next', { httpOnly: true })
    store.set.mockImplementationOnce(() => {
      throw new Error('Server Component cannot set cookie')
    })
    expect(() => options.cookies.setAll([{ name: 'session', value: 'next', options: {} }])).not.toThrow()
  })

  it('creates browser and privileged clients from their separate keys', () => {
    const browserPromise = import('./browser')
    return browserPromise.then(({ supabaseBrowser }) => {
      expect(supabaseBrowser).toBeDefined()
      expect(mocks.createBrowserClient).toHaveBeenCalledWith('https://project.supabase.co', 'publishable', {
        auth: { detectSessionInUrl: false },
      })
      mocks.getServerEnv.mockReturnValue({ SUPABASE_SERVICE_ROLE_KEY: 'secret-test-only' })
      mocks.createAdminClient.mockReturnValue({ from: vi.fn() })
      expect(getSupabaseAdminClient()).toBeDefined()
      expect(mocks.createAdminClient).toHaveBeenCalledWith('https://project.supabase.co', 'secret-test-only', {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    })
  })
})
