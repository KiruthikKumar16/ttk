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
      message: 'Service role access is limited to readiness checks and authorized storage operations.',
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
      'no-restricted-syntax': [
        'error',
        { selector: 'MemberExpression[property.name="only"]', message: 'Focused tests must not be committed.' },
        {
          selector: 'MemberExpression[property.name="skip"]',
          message: 'Skipped tests require an active issue and cannot be committed in this suite.',
        },
      ],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    ignores: [
      'app/api/verify/**/route.ts',
      'app/api/course-materials/route.ts',
      'app/api/invoices/**/download/route.ts',
      'app/api/ready/route.ts',
      'app/api/admin/users/route.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', adminDataRestriction],
    },
  },
]
