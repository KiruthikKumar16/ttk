import { test, expect } from '@playwright/test'

test('staff can load a roster and mark a student present', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/attendance')
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  const course = page.locator('select[name="courseId"]')
  const options = await course.locator('option').count()
  expect(options).toBeGreaterThan(1)
  await course.selectOption({ index: 1 })
  await page.locator('input[name="date"]').fill(new Date().toISOString().slice(0, 10))
  await page.getByRole('button', { name: 'Load roster' }).click()
  const student = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: /^Present for / }) })
    .first()
  await expect(student).toBeVisible()
  const refresh = page.waitForResponse((response) => {
    const request = response.request()
    return (
      request.method() === 'GET' &&
      request.headers()['rsc'] === '1' &&
      new URL(response.url()).pathname === '/attendance'
    )
  })
  await student.getByRole('button', { name: /^Present for / }).click()
  await expect(page.locator('p[role="status"]')).toContainText('Attendance saved')
  const refreshedRoster = await refresh
  expect(refreshedRoster.ok()).toBe(true)
  await expect(
    page
      .getByRole('heading', { name: 'Attendance records' })
      .locator('xpath=following::tbody[1]')
      .getByText(new Date().toISOString().slice(0, 10)),
  ).toBeVisible()
})
