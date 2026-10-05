import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/security/csrf', () => ({
  validateMutationRequest: () => null,
}))
vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: async () => ({ success: true }),
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logProductEvent: vi.fn(),
}))

const state = vi.hoisted(() => ({
  user: {
    id: 'user-123',
    app_metadata: { role: 'pending' },
  } as any,
  profile: {
    id: 'user-123',
    role: 'pending',
    full_name: 'Test User',
  } as any,
  inviteCode: {
    id: 'invite-456',
    code: 'ADMIN-9999-XXXX',
    role: 'admin',
    is_used: false,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    recipient_email: null as string | null,
  } as any,
  authError: null as any,
  updatedUserMeta: null as any,
  updatedProfile: null as any,
  markedUsedCodeId: null as any,
  signOutCalled: false,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async () => ({
        data: { user: state.user, session: state.user ? {} : null },
        error: state.authError,
      }),
      signOut: async () => {
        state.signOutCalled = true
        return { error: null }
      },
    },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        const query: any = {
          select: () => query,
          eq: (_col: string, val: string) => {
            return {
              maybeSingle: async () => ({ data: state.profile, error: null }),
            }
          },
          update: (fields: any) => {
            state.updatedProfile = fields
            return {
              eq: () => Promise.resolve({ error: null }),
            }
          },
        }
        return query
      }
      if (table === 'invite_codes') {
        const query: any = {
          select: () => query,
          ilike: (_col: string, val: string) => {
            if (val === state.inviteCode?.code) {
              return { maybeSingle: async () => ({ data: state.inviteCode, error: null }) }
            }
            return { maybeSingle: async () => ({ data: null, error: null }) }
          },
          update: (fields: any) => {
            return {
              eq: (_col: string, id: string) => {
                state.markedUsedCodeId = id
                return Promise.resolve({ error: null })
              },
            }
          },
        }
        return query
      }
      return { select: () => ({ maybeSingle: async () => ({ data: null }) }) }
    },
    auth: {
      admin: {
        updateUserById: async (id: string, updates: any) => {
          state.updatedUserMeta = updates
          return { data: { id }, error: null }
        },
      },
    },
  }),
}))

describe('Redeem Invite & Login Synchronization Flow', () => {
  beforeEach(() => {
    state.user = { id: 'user-123', app_metadata: { role: 'pending' } }
    state.profile = { id: 'user-123', role: 'pending', full_name: 'Test User' }
    state.inviteCode = {
      id: 'invite-456',
      code: 'ADMIN-9999-XXXX',
      role: 'admin',
      is_used: false,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      recipient_email: null,
    }
    state.authError = null
    state.updatedUserMeta = null
    state.updatedProfile = null
    state.markedUsedCodeId = null
    state.signOutCalled = false
  })

  describe('POST /api/auth/redeem-invite', () => {
    it('allows a pending user to redeem an admin OTP and activates them as admin', async () => {
      const { POST } = await import('@/app/api/auth/redeem-invite/route')
      const req = new Request('https://app.example.test/api/auth/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          code: 'ADMIN-9999-XXXX',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.activated).toBe(true)
      expect(json.data.role).toBe('admin')

      // Verify DB profile updated to admin
      expect(state.updatedProfile).toMatchObject({ role: 'admin' })
      // Verify Supabase Auth raw_app_meta_data updated to admin
      expect(state.updatedUserMeta).toMatchObject({
        app_metadata: { role: 'admin' },
      })
      // Verify invite code marked as used
      expect(state.markedUsedCodeId).toBe('invite-456')
    })

    it('allows a staff user to redeem an admin OTP and upgrades them to admin', async () => {
      state.user = { id: 'user-123', app_metadata: { role: 'staff' } }
      state.profile = { id: 'user-123', role: 'staff', full_name: 'Staff User' }

      const { POST } = await import('@/app/api/auth/redeem-invite/route')
      const req = new Request('https://app.example.test/api/auth/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'staff@example.com',
          password: 'Password123!',
          code: 'ADMIN-9999-XXXX',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.activated).toBe(true)
      expect(json.data.role).toBe('admin')
      expect(state.updatedProfile).toMatchObject({ role: 'admin' })
      expect(state.updatedUserMeta).toMatchObject({
        app_metadata: { role: 'admin' },
      })
    })

    it('returns alreadyActive if user is already an admin redeeming an admin OTP', async () => {
      state.user = { id: 'user-123', app_metadata: { role: 'admin' } }
      state.profile = { id: 'user-123', role: 'admin', full_name: 'Admin User' }

      const { POST } = await import('@/app/api/auth/redeem-invite/route')
      const req = new Request('https://app.example.test/api/auth/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Password123!',
          code: 'ADMIN-9999-XXXX',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.alreadyActive).toBe(true)
      expect(json.data.role).toBe('admin')
      expect(state.updatedProfile).toBeNull()
    })
  })

  describe('POST /api/auth/login', () => {
    it('blocks login and signs out if profile role is still pending', async () => {
      state.user = { id: 'user-123', app_metadata: { role: 'pending' } }
      state.profile = { id: 'user-123', role: 'pending' }

      const { POST } = await import('@/app/api/auth/login/route')
      const req = new Request('https://app.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'pending@example.com',
          password: 'Password123!',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe('ACCOUNT_PENDING_APPROVAL')
      expect(state.signOutCalled).toBe(true)
    })

    it('synchronizes app_metadata to admin and allows login if profile has been approved as admin', async () => {
      // User auth JWT metadata was still 'pending'
      state.user = { id: 'user-123', app_metadata: { role: 'pending' } }
      // But admin approved profile in DB as 'admin'
      state.profile = { id: 'user-123', role: 'admin' }

      const { POST } = await import('@/app/api/auth/login/route')
      const req = new Request('https://app.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'approved@example.com',
          password: 'Password123!',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(state.signOutCalled).toBe(false)
      expect(state.updatedUserMeta).toMatchObject({
        app_metadata: { role: 'admin' },
      })
    })

    it('synchronizes app_metadata to admin when user was staff but profile upgraded to admin', async () => {
      state.user = { id: 'user-123', app_metadata: { role: 'staff' } }
      state.profile = { id: 'user-123', role: 'admin' }

      const { POST } = await import('@/app/api/auth/login/route')
      const req = new Request('https://app.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'upgraded@example.com',
          password: 'Password123!',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(state.signOutCalled).toBe(false)
      expect(state.updatedUserMeta).toMatchObject({
        app_metadata: { role: 'admin' },
      })
    })
  })
})
