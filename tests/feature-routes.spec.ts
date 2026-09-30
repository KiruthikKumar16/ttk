import { test, expect } from '@playwright/test'

const staffPages = [
  ['/students', 'Students'],
  ['/attendance', 'Mark attendance'],
  ['/assessments', 'Assessments'],
  ['/materials', 'Course materials'],
  ['/reports', 'Reports'],
] as const

const adminOnlyPages = [
  ['/invoices', 'Invoices'],
  ['/courses', 'Manage Courses'],
  ['/certificates', 'Certificates'],
  ['/settings/brand', 'Brand information'],
] as const

for (const [path, heading] of staffPages) {
  test(`${path} renders for the seeded staff session`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  })
}

for (const [path, heading] of adminOnlyPages) {
  test(`${path} renders for the seeded admin session`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/.auth/admin.json' })
    const page = await context.newPage()
    try {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test(`${path} blocks the seeded staff session`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).not.toBeVisible()
  })
}

test('staff cannot access admin-only user-role management', async ({ page }) => {
  await page.goto('/settings/users')
  await expect(page.getByRole('heading', { name: 'Users and roles', exact: true })).not.toBeVisible()
})
