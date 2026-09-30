import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const scan = async (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()

test('login page has no axe WCAG 2.2 AA serious or critical violations', async ({ page }) => {
  await page.goto('/login')
  const results = await scan(page)
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
})

for (const [path, name] of [
  ['/', 'dashboard'],
  ['/students', 'students'],
  ['/invoices', 'invoices'],
  ['/courses', 'courses'],
  ['/attendance', 'attendance'],
  ['/assessments', 'assessments'],
  ['/materials', 'materials'],
  ['/certificates', 'certificates'],
  ['/reports', 'reports'],
  ['/settings/brand', 'brand settings'],
  ['/settings/gst', 'GST settings'],
] as const) {
  test(`${name} page has no axe WCAG 2.2 AA serious or critical violations`, async ({ page }) => {
    await page.goto(path)
    const results = await scan(page)
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  })
}
