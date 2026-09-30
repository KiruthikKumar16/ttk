import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { test as setup, expect } from '@playwright/test'

setup.describe.configure({ mode: 'serial' })

for (const role of ['admin', 'staff'] as const) {
  setup(`sign in once as the seeded local ${role} user`, async ({ page }) => {
    const email = process.env[`E2E_${role.toUpperCase()}_EMAIL`]
    const password = process.env[`E2E_${role.toUpperCase()}_PASSWORD`]
    if (!email || !password)
      throw new Error(`E2E_${role.toUpperCase()}_EMAIL and password must be provided by the local test runner.`)
    await page.goto('/login')
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
    const storageState = `tests/.auth/${role}.json`
    await mkdir(dirname(storageState), { recursive: true })
    await page.context().storageState({ path: storageState })
  })
}
