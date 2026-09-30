import { expect, test } from '@playwright/test'

test('liveness returns build metadata and a request correlation ID without authentication', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  expect(response.headers()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i)
  expect(await response.json()).toMatchObject({
    ok: true,
    version: expect.any(String),
    commit: expect.any(String),
  })
})

test('readiness verifies the local database migration and private materials bucket', async ({ request }) => {
  const response = await request.get('/api/ready')
  expect(response.status()).toBe(200)
  expect(response.headers()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i)
  await expect(response.json()).resolves.toEqual({ ready: true })
})
