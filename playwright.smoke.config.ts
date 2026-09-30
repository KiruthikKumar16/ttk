import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.SMOKE_BASE_URL
if (!baseURL) throw new Error('SMOKE_BASE_URL is required for deployed smoke tests.')

export default defineConfig({
  testDir: './tests',
  testMatch: '**/deploy-smoke.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['junit', { outputFile: 'test-results/deploy-smoke-junit.xml' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    storageState: { cookies: [], origins: [] },
    trace: 'on-first-retry',
  },
})
