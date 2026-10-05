import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      NEXT_PUBLIC_VERIFY_BASE_URL: 'https://test.example.com',
      NEXT_PUBLIC_APP_URL: 'https://test.example.com',
    },
  },
})
