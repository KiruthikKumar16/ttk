import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  user: { id: 'test-user' } as { id: string } | null,
  authError: null as { name: string; status?: number } | null,
  role: 'admin' as string,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: authState.user }, error: authState.authError }),
      getClaims: async () => ({ data: { claims: { aal: 'aal2' } }, error: null }),
    },
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        single: async () => ({ data: { role: authState.role }, error: null }),
      }
      return query
    },
  }),
}))
vi.mock('server-only', () => ({}))

import { withApi } from '@/lib/http/handler'
import { rolesFor, type Action, type Resource } from '@/lib/auth/permissions'

const adminOnly = withApi({ roles: ['admin'] }, async () => ({ protected: true }))

function request() {
  return new Request('https://app.example.test/api/protected')
}

describe('withApi authentication and authorization', () => {
  beforeEach(() => {
    authState.user = { id: 'test-user' }
    authState.authError = null
    authState.role = 'admin'
  })

  it('returns 401 when there is no session', async () => {
    authState.user = null
    const response = await adminOnly(request())
    expect(response.status).toBe(401)
  })

  it('returns 401 for an expired session', async () => {
    authState.authError = { name: 'AuthApiError', status: 401 }
    const response = await adminOnly(request())
    expect(response.status).toBe(401)
  })

  it('returns 403 when the current role is not allowed', async () => {
    authState.role = 'trainer'
    const response = await adminOnly(request())
    expect(response.status).toBe(403)
  })

  it('uses the current database role on each request after a role change', async () => {
    expect((await adminOnly(request())).status).toBe(200)
    authState.role = 'staff'
    expect((await adminOnly(request())).status).toBe(403)
  })

  it('denies pending role access to any protected route', async () => {
    authState.role = 'pending'
    const handler = withApi({ roles: rolesFor('students', 'read') }, async () => ({ allowed: true }))
    const response = await handler(request())
    expect(response.status).toBe(401)
  })

  it.each([
    ['GET /api/students', 'students', 'read'],
    ['POST /api/students', 'students', 'create'],
    ['GET /api/payments', 'payments', 'read'],
    ['POST /api/payments', 'payments', 'create'],
    ['GET /api/courses', 'courses', 'read'],
    ['POST /api/courses', 'courses', 'create'],
    ['GET /api/certificates', 'certificates', 'read'],
    ['POST /api/certificates', 'certificates', 'create'],
    ['GET /api/attendance', 'attendance', 'read'],
    ['POST /api/attendance', 'attendance', 'create'],
    ['GET /api/assessments', 'assessments', 'read'],
    ['POST /api/assessments', 'assessments', 'create'],
    ['GET /api/course-materials', 'materials', 'read'],
    ['DELETE /api/course-materials', 'materials', 'delete'],
    ['GET /api/reports', 'reports', 'read'],
    ['GET /api/gst', 'gst', 'read'],
    ['GET /api/audit', 'audit', 'read'],
    ['PATCH /api/admin/users', 'users', 'manage'],
  ] as const)('%s applies its declared role policy', async (_route, resource: Resource, action: Action) => {
    const handler = withApi({ roles: rolesFor(resource, action) }, async () => ({ allowed: true }))
    for (const role of ['admin', 'staff', 'trainer'] as const) {
      authState.role = role
      const response = await handler(request())
      const expected = rolesFor(resource, action).includes(role) ? 200 : 403
      expect(response.status, `${role} policy for ${resource}.${action}`).toBe(expected)
    }
  })
})
