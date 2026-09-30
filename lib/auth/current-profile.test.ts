import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  user: { id: 'u1' } as null | { id: string },
  authError: null as Error | null,
  profile: { id: 'u1', role: 'staff', full_name: null } as any,
  profileError: null as Error | null,
}))
vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  redirect: (path: string): never => {
    throw new Error(`REDIRECT:${path}`)
  },
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user }, error: mocks.authError }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.profile, error: mocks.profileError }) }) }),
    }),
  }),
}))

import { getCurrentProfile, requirePermission } from './current-profile'

describe('current profile and permission guard', () => {
  beforeEach(() => {
    mocks.user = { id: 'u1' }
    mocks.authError = null
    mocks.profile = { id: 'u1', role: 'staff', full_name: null }
    mocks.profileError = null
  })

  it('maps the signed-in profile and defaults an empty display name', async () => {
    await expect(getCurrentProfile()).resolves.toEqual({ id: 'u1', role: 'staff', fullName: '' })
  })

  it.each(['missing-user', 'auth-error', 'missing-profile', 'invalid-role', 'profile-error'])(
    'redirects to login for %s',
    async (reason) => {
      if (reason === 'missing-user') mocks.user = null
      if (reason === 'auth-error') mocks.authError = new Error('expired')
      if (reason === 'missing-profile') mocks.profile = null
      if (reason === 'invalid-role') mocks.profile = { id: 'u1', role: 'owner', full_name: 'No' }
      if (reason === 'profile-error') mocks.profileError = new Error('db')
      await expect(getCurrentProfile()).rejects.toThrow('REDIRECT:/login')
    },
  )

  it('returns an authorized profile and redirects when the action is denied', async () => {
    await expect(requirePermission('students', 'read')).resolves.toMatchObject({ role: 'staff' })
    await expect(requirePermission('users', 'manage')).rejects.toThrow('REDIRECT:/')
  })
})
