import { chromium } from 'playwright'
import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'docs/screenshots/responsive'
const ARTIFACT_DIR = 'C:\\Users\\mkiru\\.gemini\\antigravity-ide\\brain\\f02364aa-bd4b-480c-b45f-862f1b6c0a6c'

const VIEWPORTS = [
  { name: 'mobile_portrait', width: 375, height: 667, label: 'Mobile (iPhone 375x667)' },
  { name: 'duo_single', width: 540, height: 720, label: 'Surface Duo Single Screen (540x720)' },
  { name: 'duo_spanned', width: 1080, height: 720, label: 'Surface Duo Spanned (1080x720)' },
  { name: 'tablet_portrait', width: 768, height: 1024, label: 'Tablet Portrait (iPad 768x1024)' },
  { name: 'laptop_desktop', width: 1280, height: 800, label: 'Laptop / Desktop (1280x800)' },
]

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  console.log('🚀 Browser launched. Testing cross-platform responsiveness...')

  const capturedImages = []

  // Helper to save screenshot both in docs/ and in artifact directory
  async function saveScreenshot(page, filename) {
    const localPath = path.join(OUTPUT_DIR, filename)
    await page.screenshot({ path: localPath, fullPage: false })
    const artifactPath = path.join(ARTIFACT_DIR, filename)
    try {
      await copyFile(localPath, artifactPath)
    } catch (e) {
      console.warn('Could not copy to artifact dir:', e.message)
    }
    capturedImages.push(filename)
    console.log(`  ✓ Saved: ${filename}`)
  }

  // 1. Unauthenticated Pages across all viewports
  for (const vp of VIEWPORTS) {
    console.log(`\n📱 Testing Viewport: ${vp.label}`)
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()

    // Login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await saveScreenshot(page, `${vp.name}_login.png`)

    // Signup page
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await saveScreenshot(page, `${vp.name}_signup.png`)

    // Pending approval page
    await page.goto(`${BASE_URL}/pending-approval`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await saveScreenshot(page, `${vp.name}_pending.png`)

    await context.close()
  }

  // 2. Authenticated Session Pages across viewports
  console.log('\n🔐 Performing authentication for authenticated views...')
  const authContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const authPage = await authContext.newPage()
  await authPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await authPage.getByLabel('Email address').fill('test_device_admin@thoorigai.test')
  await authPage.getByLabel('Password').fill('Password123!Secure')
  await authPage.getByRole('button', { name: 'Sign in' }).click()
  await authPage.waitForURL(`${BASE_URL}/`, { timeout: 15000 })
  console.log('✓ Successfully signed in as admin!')

  // Export storage state for authenticated sessions
  const storageState = await authContext.storageState()
  await authContext.close()

  // 3. Test Dashboard & Users/Roles across viewports with drawer testing
  for (const vp of VIEWPORTS) {
    console.log(`\n🖥️  Testing Authenticated Viewport: ${vp.label}`)
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      storageState,
    })
    const page = await context.newPage()

    // Dashboard
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await saveScreenshot(page, `${vp.name}_dashboard.png`)

    // Mobile / Tablet Drawer Test
    if (vp.width < 1024) {
      console.log(`  🔍 Testing mobile slide-over drawer on ${vp.name}...`)
      const menuButton = page.locator('button[aria-label="Toggle navigation"]')
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(400)
        await saveScreenshot(page, `${vp.name}_nav_drawer.png`)
        // Close drawer with ESC or X
        const closeBtn = page.locator('button[aria-label="Close navigation"]')
        if (await closeBtn.isVisible()) {
          await closeBtn.click()
          await page.waitForTimeout(300)
        }
      }
    }

    // Settings -> Users & Roles
    await page.goto(`${BASE_URL}/settings/users`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await saveScreenshot(page, `${vp.name}_users.png`)

    // Open "Generate Invite Code" modal on mobile & duo
    if (vp.width <= 768) {
      const genBtn = page.locator('button:has-text("Generate Invite Code")').first()
      if (await genBtn.isVisible()) {
        await genBtn.click()
        await page.waitForTimeout(400)
        await saveScreenshot(page, `${vp.name}_invite_modal.png`)
        await page.keyboard.press('Escape')
      }
    }

    await context.close()
  }

  await browser.close()
  console.log(`\n🎉 All ${capturedImages.length} responsive screenshots captured successfully!`)
}

run().catch((err) => {
  console.error('Test run failed:', err)
  process.exit(1)
})
