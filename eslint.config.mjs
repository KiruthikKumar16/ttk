import tsParser from '@typescript-eslint/parser'

const mockDataRestriction = {
  patterns: [
    {
      group: ['**/mock-data'],
      message: 'Use Supabase data, a test fixture, or supabase/seed.sql instead.',
    },
  ],
}

const adminDataRestriction = {
  ...mockDataRestriction,
  patterns: [
    ...mockDataRestriction.patterns,
    {
      group: ['**/supabase/admin'],
      message: 'Service role access is limited to verification, storage signing, and error logging.',
    },
  ],
}

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser },
    rules: {
      'no-restricted-imports': ['error', mockDataRestriction],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    ignores: [
      'app/api/verify/**/route.ts',
      'app/api/course-materials/route.ts',
      'lib/errorReporting.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', adminDataRestriction],
    },
  },
]
