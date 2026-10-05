import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock Supabase admin client and server client
const mockInviteData = vi.hoisted(() => ({
  id: 'test-invite-id',
  code: 'ADMIN-84HF-29KL',
  role: 'admin',
  recipient_email: null as string | null,
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  is_used: false,
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === 'invite_codes') {
        const query = {
          select: () => query,
          ilike: (_col: string, val: string) => {
            if (val === 'ADMIN-84HF-29KL') {
              return { maybeSingle: async () => ({ data: mockInviteData, error: null }) }
            }
            if (val === 'USED-CODE-1234') {
              return {
                maybeSingle: async () => ({
                  data: { ...mockInviteData, is_used: true },
                  error: null,
                }),
              }
            }
            if (val === 'EXPIRED-CODE-12') {
              return {
                maybeSingle: async () => ({
                  data: { ...mockInviteData, expires_at: new Date(Date.now() - 10000).toISOString() },
                  error: null,
                }),
              }
            }
            return { maybeSingle: async () => ({ data: null, error: null }) }
          },
        }
        return query
      }
      return { select: () => ({ maybeSingle: async () => ({ data: null }) }) }
    },
  }),
}))

describe('Invite Code & OTP Verification Flow', () => {
  it('verifies the static master passcode as staff role', async () => {
    const { GET } = await import('@/app/api/auth/verify-invite/route')
    const req = new Request('https://app.example.test/api/auth/verify-invite?code=THOORIGAI-STAFF')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
    expect(json.role).toBe('staff')
  })

  it('verifies a valid admin invite code and preserves the admin role', async () => {
    const { GET } = await import('@/app/api/auth/verify-invite/route')
    const req = new Request('https://app.example.test/api/auth/verify-invite?code=ADMIN-84HF-29KL')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
    expect(json.role).toBe('admin')
  })

  it('rejects an already used invite code', async () => {
    const { GET } = await import('@/app/api/auth/verify-invite/route')
    const req = new Request('https://app.example.test/api/auth/verify-invite?code=USED-CODE-1234')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.error).toContain('already been redeemed')
  })

  it('rejects an expired invite code', async () => {
    const { GET } = await import('@/app/api/auth/verify-invite/route')
    const req = new Request('https://app.example.test/api/auth/verify-invite?code=EXPIRED-CODE-12')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.error).toContain('expired')
  })

  it('rejects a non-existent invite code', async () => {
    const { GET } = await import('@/app/api/auth/verify-invite/route')
    const req = new Request('https://app.example.test/api/auth/verify-invite?code=NONEXISTENT')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.error).toContain('not found')
  })
})
