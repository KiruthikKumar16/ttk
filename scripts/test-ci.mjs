import { spawn } from 'node:child_process'
import process from 'node:process'

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const run = (args, options = {}) =>
  new Promise((resolve, reject) => {
    const { quiet = false, ...spawnOptions } = options
    const child = spawn(pnpm, args, {
      stdio: quiet ? 'ignore' : 'inherit',
      shell: process.platform === 'win32',
      ...spawnOptions,
    })
    child.once('error', reject)
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${args.join(' ')} failed with exit code ${code}`)),
    )
  })

function parseEnv(source) {
  const result = {}
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (!match) continue
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    result[match[1]] = value
  }
  return result
}

function localSupabaseEnv() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['exec', 'supabase', 'status', '--output', 'env'],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.setEncoding('utf8').on('data', (chunk) => {
      stderr += chunk
    })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code !== 0) return reject(new Error(`Could not read local Supabase status (exit ${code}). ${stderr}`))
      const values = parseEnv(stdout)
      const url = values.API_URL ?? values.NEXT_PUBLIC_SUPABASE_URL
      const publishableKey = values.ANON_KEY ?? values.PUBLISHABLE_KEY ?? values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      const serviceKey = values.SERVICE_ROLE_KEY ?? values.SECRET_KEY
      if (!url || !publishableKey || !serviceKey)
        return reject(new Error('Local Supabase status did not include API_URL, ANON_KEY, and SERVICE_ROLE_KEY.'))
      resolve({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
        NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3001',
        NEXT_PUBLIC_VERIFY_BASE_URL: 'http://127.0.0.1:3001',
        SUPABASE_SERVICE_ROLE_KEY: serviceKey,
        SUPABASE_TEST_URL: url,
        SUPABASE_TEST_PUBLISHABLE_KEY: publishableKey,
        SUPABASE_TEST_SERVICE_ROLE_KEY: serviceKey,
        // Release tests must stay hermetic and never consume credentials from
        // a developer's .env.local for third-party rate-limit services.
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        SUPABASE_TEST_USER_EMAIL: 'staff@thoorigai.test',
        SUPABASE_TEST_USER_PASSWORD: 'ThoorigaiLocal123!',
        E2E_ADMIN_EMAIL: 'admin@thoorigai.test',
        E2E_ADMIN_PASSWORD: 'ThoorigaiLocal123!',
        E2E_STAFF_EMAIL: 'staff@thoorigai.test',
        E2E_STAFF_PASSWORD: 'ThoorigaiLocal123!',
        E2E_TRAINER_EMAIL: 'trainer@thoorigai.test',
        E2E_TRAINER_PASSWORD: 'ThoorigaiLocal123!',
        PLAYWRIGHT_TEST: '1',
      })
    })
  })
}

let started = false
try {
  // Supabase prints local API keys from `start`; suppress its success output.
  await run(['exec', 'supabase', 'start', '--exclude', 'studio,postgres-meta'], { quiet: true })
  started = true
  await run(['db:reset'])
  await run(['db:check-rls'])
  await run(['db:lint'])
  await run(['db:test'])
  const supabaseEnv = await localSupabaseEnv()
  const env = { ...process.env, ...supabaseEnv }
  await run(['typecheck'], { env })
  await run(['lint'], { env })
  await run(['test:coverage'], { env })
  await run(['test:int'], { env })
  // Integration tests intentionally create database rows; reset before browser
  // tests so their invoice/document assertions only see the deterministic seed.
  await run(['db:reset'])
  await run(['build'], { env })
  await run(['build:budget'])
  await run(['build:client-budget'])
  if (!process.env.CI) await run(['exec', 'playwright', 'install', 'chromium'], { env })
  await run(['test:e2e'], { env })
  await run(['exec', 'node', 'scripts/report-slowest-e2e.mjs'], { env })
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  if (started && process.env.KEEP_TEST_STACK !== '1') {
    try {
      await run(['db:stop'])
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  } else if (started) console.log('Local Supabase left running because KEEP_TEST_STACK=1.')
}
