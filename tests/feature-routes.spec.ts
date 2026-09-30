import { test, expect } from '@playwright/test'

const staffPages = [
  ['/students', 'Students'],
  ['/invoices', 'Invoices'],
  ['/courses', 'Manage Courses'],
  ['/attendance', 'Mark attendance'],
  ['/assessments', 'Assessments'],
  ['/materials', 'Course materials'],
  ['/certificates', 'Certificates'],
  ['/reports', 'Reports'],
  ['/settings/brand', 'Brand information'],
] as const

for (const [path, heading] of staffPages) {
  test(`${path} renders for the seeded staff session`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  })
}

test('staff cannot access admin-only user-role management', async ({ page }) => {
  await page.goto('/settings/users')
  await expect(page.getByRole('heading', { name: 'Users and roles', exact: true })).not.toBeVisible()
})
