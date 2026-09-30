import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  user: { id: 'test-user' } as { id: string } | null,
  authError: null as { name: string; status?: number } | null,
  role: 'admin' as string,
  profileError: null as Error | null,
  assurance: 'aal2' as string,
  assuranceError: null as Error | null,
}))
const mockLogger = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }))
const logProductEvent = vi.hoisted(() => vi.fn())
vi.mock('@/lib/logger', () => ({ logger: mockLogger, logProductEvent }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: authState.user }, error: authState.authError }),
      getClaims: async () => ({ data: { claims: { aal: authState.assurance } }, error: authState.assuranceError }),
    },
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        single: async () => ({ data: { role: authState.role }, error: authState.profileError }),
      }
      return query
    },
  }),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/security/rate-limit', () => ({ rateLimit: async () => ({ success: true, retryAfterSeconds: 0 }) }))

import { withApi } from '@/lib/http/handler'
import { rolesFor, type Action, type Resource } from '@/lib/auth/permissions'
import { z } from 'zod'

const adminOnly = withApi({ roles: ['admin'] }, async () => ({ protected: true }))

function request() {
  return new Request('https://app.example.test/api/protected')
}

describe('withApi authentication and authorization', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test')
    authState.user = { id: 'test-user' }
    authState.authError = null
    authState.role = 'admin'
    authState.profileError = null
    authState.assurance = 'aal2'
    authState.assuranceError = null
  })
  afterEach(() => vi.unstubAllEnvs())

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
    authState.role = 'staff'
    const response = await adminOnly(request())
    expect(response.status).toBe(403)
  })

  it('uses the current database role on each request after a role change', async () => {
    expect((await adminOnly(request())).status).toBe(200)
    authState.role = 'staff'
    expect((await adminOnly(request())).status).toBe(403)
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
    for (const role of ['admin', 'staff'] as const) {
      authState.role = role
      const response = await handler(request())
      const expected = rolesFor(resource, action).includes(role) ? 200 : 403
      expect(response.status, `${role} policy for ${resource}.${action}`).toBe(expected)
    }
  })

  it('validates query, JSON body and async route params before calling the handler', async () => {
    authState.role = 'staff'
    const handler = withApi(
      {
        roles: ['staff'],
        query: z.object({ page: z.coerce.number().int().min(1) }),
        body: z.object({ value: z.string().min(1) }),
        params: z.object({ id: z.string() }),
      },
      async ({ query, body, params }) => ({ query, body, params }),
    )
    const valid = new Request('https://app.example.test/api/protected?page=3', {
      method: 'POST',
      headers: { origin: 'https://app.example.test', host: 'app.example.test', 'content-type': 'application/json' },
      body: JSON.stringify({ value: 'ok' }),
    })
    const response = await handler(valid, { params: Promise.resolve({ id: 'abc' }) })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: { query: { page: 3 }, body: { value: 'ok' }, params: { id: 'abc' } },
    })
    const invalidQuery = await handler(new Request('https://app.example.test/api/protected?page=0'))
    expect(invalidQuery.status).toBe(400)
    const invalidBody = await handler(
      new Request('https://app.example.test/api/protected?page=1', {
        method: 'POST',
        headers: { origin: 'https://app.example.test', host: 'app.example.test', 'content-type': 'application/json' },
        body: '{',
      }),
    )
    expect(invalidBody.status).toBe(400)
  })

  it('rejects CSRF failures and honors admin role', async () => {
    const mutating = withApi({ roles: ['staff'], body: z.object({ ok: z.boolean() }) }, async () => ({ ok: true }))
    expect((await mutating(new Request('https://app.example.test/api', { method: 'POST', body: '{}' }))).status).toBe(
      403,
    )
    const adminAction = withApi({ roles: ['admin'] }, async () => ({ ok: true }))
    expect((await adminAction(request())).status).toBe(200)
    authState.profileError = new Error('profile unavailable')
    expect((await adminOnly(request())).status).toBe(500)
  })

  it('supports public routes, raw Responses and catches unexpected failures', async () => {
    authState.role = 'staff'
    expect((await withApi({ public: true }, async () => ({ status: 'ok' }))(request())).status).toBe(200)
    expect(
      (await withApi({ roles: ['staff'] }, async () => new Response('file', { status: 201 }))(request())).status,
    ).toBe(201)
    expect(
      (
        await withApi({ roles: ['staff'] }, async () => {
          throw new Error('private detail')
        })(request())
      ).status,
    ).toBe(500)
    expect(() => withApi({ public: true, roles: ['admin'] } as never, async () => null)).toThrow(
      'Public handlers cannot declare roles.',
    )
    expect(() => withApi({} as never, async () => null)).toThrow('withApi requires roles')
  })

  it('preserves a validated proxy request ID in the JSON body and response header', async () => {
    const traced = withApi({ public: true }, async ({ requestId }) => ({ requestId }))
    const response = await traced(
      new Request('https://app.example.test/api/trace', { headers: { 'x-request-id': 'trace.123' } }),
    )
    expect(response.headers.get('x-request-id')).toBe('trace.123')
    await expect(response.json()).resolves.toMatchObject({ data: { requestId: 'trace.123' } })
  })
})
