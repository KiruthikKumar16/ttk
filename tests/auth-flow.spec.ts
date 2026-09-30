import { test, expect } from '@playwright/test'

test('staff can log in and sign out, and the expired session returns to login', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()
  try {
    await page.goto('/login')
    await page.getByLabel('Email address').fill(process.env.E2E_STAFF_EMAIL!)
    await page.getByLabel('Password').fill(process.env.E2E_STAFF_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/127\.0\.0\.1:3001\//)
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/students')
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('Email address').fill(process.env.E2E_STAFF_EMAIL!)
    await page.getByLabel('Password').fill(process.env.E2E_STAFF_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    await context.clearCookies()
    await page.goto('/students')
    await expect(page).toHaveURL(/\/login$/)
  } finally {
    await context.close()
  }
})
