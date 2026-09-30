import { appendFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const result = spawnSync('pnpm', ['exec', 'supabase', 'status', '--output', 'env'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
if (result.error || result.status !== 0) {
  process.stderr.write('Unable to read local Supabase test configuration.\n')
  process.exit(result.status || 1)
}

const values = Object.fromEntries(
  result.stdout.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (!match) return []
    const value = match[2].replace(/^['"]|['"]$/g, '')
    return [[match[1], value]]
  }),
)
const url = values.API_URL ?? values.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = values.PUBLISHABLE_KEY ?? values.ANON_KEY ?? values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const serviceRoleKey = values.SECRET_KEY ?? values.SERVICE_ROLE_KEY
if (!url || !publishableKey || !serviceRoleKey || !process.env.GITHUB_ENV) {
  process.stderr.write('Local Supabase status or GitHub environment file is incomplete.\n')
  process.exit(1)
}

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3001',
  NEXT_PUBLIC_VERIFY_BASE_URL: 'http://127.0.0.1:3001',
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  SUPABASE_TEST_URL: url,
  SUPABASE_TEST_PUBLISHABLE_KEY: publishableKey,
  SUPABASE_TEST_SERVICE_ROLE_KEY: serviceRoleKey,
  SUPABASE_TEST_USER_EMAIL: 'staff@thoorigai.test',
  SUPABASE_TEST_USER_PASSWORD: 'ThoorigaiLocal123!',
  E2E_ADMIN_EMAIL: 'admin@thoorigai.test',
  E2E_ADMIN_PASSWORD: 'ThoorigaiLocal123!',
  E2E_STAFF_EMAIL: 'staff@thoorigai.test',
  E2E_STAFF_PASSWORD: 'ThoorigaiLocal123!',
  E2E_TRAINER_EMAIL: 'trainer@thoorigai.test',
  E2E_TRAINER_PASSWORD: 'ThoorigaiLocal123!',
  PLAYWRIGHT_TEST: '1',
}
appendFileSync(
  process.env.GITHUB_ENV,
  Object.entries(environment)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n',
)
