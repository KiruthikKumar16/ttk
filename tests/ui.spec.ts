import { test, expect } from '@playwright/test'

test('signed-in staff reaches the dashboard and sees the ThoorigAI brand', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ThoorigAI/)
  await expect(page.locator('body')).toContainText('THOORIGAI')
  await expect(page.getByRole('heading', { name: /Good morning/i })).toBeVisible()
})

test('staff can navigate to Students and Reports from the dashboard', async ({ page }) => {
  await page.goto('/students')
  await expect(page.getByRole('heading', { name: 'Students', exact: true })).toBeVisible()
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Download CSV/i })).toBeVisible()
})
