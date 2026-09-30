import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['blob', { outputDir: 'blob-report' }],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'auth-setup', testMatch: '**/*.setup.ts' },
    {
      name: 'chromium',
      dependencies: ['auth-setup'],
      testIgnore: '**/*.setup.ts',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/staff.json' },
    },
  ],
  webServer: {
    command: 'pnpm exec next start --port 3001',
    url: 'http://127.0.0.1:3001',
    // Never attach release tests to a developer's app server or environment.
    reuseExistingServer: false,
    timeout: 120000,
  },
})
