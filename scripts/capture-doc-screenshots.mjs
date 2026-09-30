import { execFileSync, spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const localBaseUrl = 'http://127.0.0.1:3001'
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const runQuietly = (args, env = process.env) =>
  new Promise((resolve, reject) => {
    const child = spawn(packageManager, args, {
      env,
      stdio: 'ignore',
      windowsHide: true,
      shell: process.platform === 'win32',
    })
    child.once('error', reject)
    child.once('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${args[1]} exited with code ${code}.`))))
  })

const readLocalStatus = () => {
  const status = execFileSync(packageManager, ['exec', 'supabase', 'status', '--output', 'env'], {
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32',
  })
  return Object.fromEntries(
    status
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?([^"\r\n]*)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  )
}

await mkdir('docs/screenshots', { recursive: true })
let started = false
let browser
let server

try {
  await runQuietly(['exec', 'supabase', 'start', '--exclude', 'studio,postgres-meta'])
  started = true
  await runQuietly(['exec', 'supabase', 'db', 'reset', '--local'])
  const values = readLocalStatus()
  if (!values.API_URL?.startsWith('http://127.0.0.1:') || !values.ANON_KEY || !values.SERVICE_ROLE_KEY) {
    throw new Error('Local Supabase status was unavailable; cloud projects are not accepted.')
  }

  const appEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    NODE_ENV: 'production',
    NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: values.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: localBaseUrl,
    NEXT_PUBLIC_VERIFY_BASE_URL: localBaseUrl,
    APP_ENV: 'local',
    NEXT_PUBLIC_APP_ENV: 'local',
    NEXT_PUBLIC_SENTRY_DSN: '',
    SENTRY_DSN: '',
    PLAYWRIGHT_TEST: '1',
  }
  if (!process.argv.includes('--skip-build')) await runQuietly(['run', 'build'], appEnv)
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3001'], {
    env: appEnv,
    stdio: 'ignore',
    windowsHide: true,
  })

  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Local Next server exited with code ${server.exitCode}.`)
    try {
      const response = await fetch(`${localBaseUrl}/login`)
      if (response.ok) break
    } catch {
      // Wait for the local production server to begin listening.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
  await page.goto(`${localBaseUrl}/login`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'docs/screenshots/login.png', fullPage: true })
  const themeVars = await page.evaluate(() => ({
    rootStyle: document.documentElement.getAttribute('style'),
    nonceStyle: document.querySelector('style[nonce]')?.textContent ?? '',
    brandPrimary: getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim(),
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
  }))
  process.stdout.write(`Theme screenshot check: ${JSON.stringify(themeVars)}\n`)
  if (
    themeVars.brandPrimary !== '#1d4ed8' ||
    themeVars.primary !== themeVars.brandPrimary ||
    !themeVars.nonceStyle.includes('--brand-primary:#1d4ed8')
  ) {
    throw new Error(
      'The nonce-authorized brand colors did not load; refusing to capture an incorrectly styled screenshot.',
    )
  }
  const loginButton = await page.locator('button[type="submit"]').evaluate((element) => {
    const style = getComputedStyle(element)
    return { text: element.textContent?.trim(), color: style.color, background: style.backgroundColor }
  })
  process.stdout.write(`Login button screenshot check: ${JSON.stringify(loginButton)}\n`)
  if (loginButton.color !== 'rgb(255, 255, 255)' || loginButton.background !== 'rgb(29, 78, 216)') {
    throw new Error(
      'The login button colors did not load as expected; refusing to capture an incorrectly styled screenshot.',
    )
  }
  await page.getByLabel('Email address').fill('staff@thoorigai.test')
  await page.getByLabel('Password').fill('ThoorigaiLocal123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
  await page.locator('.stats-grid').waitFor()
  const addStudent = await page.getByRole('link', { name: 'Add student' }).evaluate((element) => {
    const style = getComputedStyle(element)
    return { text: element.textContent?.trim(), color: style.color, background: style.backgroundImage }
  })
  process.stdout.write(`Dashboard action screenshot check: ${JSON.stringify(addStudent)}\n`)
  if (addStudent.background === 'none') {
    throw new Error(
      'The dashboard primary action has no rendered background; refusing to capture an incorrectly styled screenshot.',
    )
  }
  await page.screenshot({
    path: 'docs/screenshots/dashboard.png',
    clip: { x: 0, y: 0, width: 1440, height: 640 },
  })
  process.stdout.write('Captured local-only login and dashboard screenshots.\n')
} finally {
  await browser?.close()
  server?.kill()
  if (started) await runQuietly(['exec', 'supabase', 'stop'])
}
