import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: { alias: { '@': root } },
  test: {
    include: ['lib/**/*.test.ts', 'modules/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/integration/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'modules/*/service.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/types.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
})
