import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: { alias: { '@': root } },
  test: {
    include: ['lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/money/**/*.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
})
