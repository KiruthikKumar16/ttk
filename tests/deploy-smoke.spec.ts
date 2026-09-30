import { expect, test } from '@playwright/test'

test('deployed health, login, and public verification routes respond', async ({ page, request }) => {
  const health = await request.get('/api/health')
  expect(health.status()).toBe(200)
  expect(await health.json()).toMatchObject({ ok: true })
  expect(health.headers()['x-request-id']).toBeTruthy()
  const csp = health.headers()['content-security-policy'] ?? ''
  const styleSrc = csp.split(';').find((part) => part.trim().startsWith('style-src ')) ?? ''
  const styleSrcAttr = csp.split(';').find((part) => part.trim().startsWith('style-src-attr')) ?? ''
  expect(styleSrc).toMatch(/'nonce-[^']+'/)
  expect(styleSrc).not.toContain("'unsafe-inline'")
  expect(styleSrcAttr).toContain("'unsafe-inline'")

  if (process.env.CHECK_READINESS === '1') {
    const readiness = await request.get('/api/ready')
    expect(readiness.status()).toBe(200)
    expect(await readiness.json()).toMatchObject({ ready: true })
  }

  const login = await page.goto('/login')
  expect(login?.status()).toBe(200)
  await expect(page.getByLabel('Email address')).toBeVisible()

  const verification = await page.goto('/verify/CI-UNKNOWN-DOCUMENT')
  expect(verification?.status()).toBe(200)
  await expect(page.locator('body')).not.toBeEmpty()
})
