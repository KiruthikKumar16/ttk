import { describe, expect, it, vi } from 'vitest'
import { adminMfaResponse } from './admin-mfa'

describe('admin MFA enforcement', () => {
  it('does not require MFA for non-admin roles', async () => {
    const supabase = { auth: { getClaims: vi.fn() } } as any
    await expect(adminMfaResponse(supabase, 'staff')).resolves.toBeNull()
    expect(supabase.auth.getClaims).not.toHaveBeenCalled()
  })

  it('permits admin only with a verified AAL2 claim', async () => {
    const getClaims = vi.fn().mockResolvedValue({ data: { claims: { aal: 'aal2' } }, error: null })
    const supabase = { auth: { getClaims } } as any
    await expect(adminMfaResponse(supabase, 'admin')).resolves.toBeNull()
    getClaims.mockResolvedValueOnce({ data: { claims: { aal: 'aal1' } }, error: null })
    getClaims.mockResolvedValueOnce({ data: { claims: {} }, error: new Error('failed') })
    for (let index = 0; index < 2; index++) {
      const response = await adminMfaResponse(supabase, 'admin')
      expect(response?.status).toBe(403)
      await expect(response?.json()).resolves.toMatchObject({ error: { code: 'MFA_REQUIRED' } })
    }
  })
})
