import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:3000'
const RECORDINGS_DIR = 'C:/Users/mkiru/.gemini/antigravity-ide/brain/f02364aa-bd4b-480c-b45f-862f1b6c0a6c/recordings'

if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true })
}

const auditLog = {
  testedPages: [],
  clickedButtons: [],
  pageErrors: [],
  consoleErrors: [],
  networkErrors: [],
  uxObservations: [],
}

async function runAudit() {
  console.log('🚀 Starting Full Automated End-to-End Audit & Video Recording...')
  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1440, height: 900 },
    },
  })

  const page = await context.newPage()

  page.on('pageerror', (err) => {
    console.error('❌ Page Error:', err.message)
    auditLog.pageErrors.push({ url: page.url(), message: err.message, stack: err.stack })
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Filter out harmless React dev warnings if any
      if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
        console.warn('⚠️ Console Error:', text)
        auditLog.consoleErrors.push({ url: page.url(), text })
      }
    }
  })

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      auditLog.networkErrors.push({ url: res.url(), status: res.status() })
    }
  })

  async function safeClick(selectorOrLocator, description) {
    try {
      const loc = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator).first() : selectorOrLocator
      if (await loc.isVisible({ timeout: 2500 })) {
        await loc.click({ timeout: 2500 })
        auditLog.clickedButtons.push(description)
        console.log(`  ✓ Clicked: ${description}`)
        await page.waitForTimeout(500)
        return true
      }
    } catch (e) {
      console.log(`  - Skipped/Timeout: ${description} (${e.message.split('\n')[0]})`)
    }
    return false
  }

  // ==========================================
  // PHASE 1: PUBLIC PAGES
  // ==========================================
  console.log('\n--- PHASE 1: PUBLIC PAGES ---')

  // 1.1 Verify Page
  console.log('Testing /verify ...')
  await page.goto(`${BASE_URL}/verify`)
  auditLog.testedPages.push('/verify')
  await page.waitForTimeout(1000)

  // Test with invalid code
  const verifyInput = page.locator('input[type="text"]').first()
  if (await verifyInput.isVisible()) {
    await verifyInput.fill('INVALID-CODE-XYZ')
    await safeClick('button[type="submit"], button:has-text("Verify")', 'Verify invalid code button')
    await page.waitForTimeout(1000)

    // Test with seeded valid code
    await verifyInput.fill('VREF-CERT-1048-A9B8')
    await safeClick('button[type="submit"], button:has-text("Verify")', 'Verify valid code VREF-CERT-1048-A9B8')
    await page.waitForTimeout(1500)
  }

  // 1.2 Login Page
  console.log('Testing /login ...')
  await page.goto(`${BASE_URL}/login`)
  auditLog.testedPages.push('/login')
  await page.waitForTimeout(1000)

  // Test invalid login
  await page.locator('input[name="email"], input[type="email"]').fill('admin@thoorigai.test')
  await page.locator('input[name="password"], input[type="password"]').fill('WrongPassword123!')
  await safeClick('button[type="submit"]', 'Sign In with invalid password')
  await page.waitForTimeout(1500)

  // 1.3 Signup Page
  console.log('Testing /signup ...')
  await page.goto(`${BASE_URL}/signup`)
  auditLog.testedPages.push('/signup')
  await page.waitForTimeout(1000)

  // Toggle invite code accordion/button if present
  const toggleInviteBtn = page.getByRole('button', { name: /passcode|code|invite/i })
  if (await toggleInviteBtn.isVisible()) {
    await safeClick(toggleInviteBtn, 'Toggle Academy Invite Passcode field')
  }

  // 1.4 Pending Page
  console.log('Testing /pending ...')
  await page.goto(`${BASE_URL}/pending`)
  auditLog.testedPages.push('/pending')
  await page.waitForTimeout(800)

  // ==========================================
  // PHASE 2: ADMIN ROLE AUDIT
  // ==========================================
  console.log('\n--- PHASE 2: ADMIN ROLE AUDIT ---')
  await page.goto(`${BASE_URL}/login`)
  await page.locator('input[name="email"], input[type="email"]').fill('admin@thoorigai.test')
  await page.locator('input[name="password"], input[type="password"]').fill('ThoorigaiLocal123!')
  await safeClick('button[type="submit"]', 'Admin Sign In button')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
  console.log('✓ Admin successfully logged in!')

  // 2.1 Admin Dashboard
  console.log('Auditing Admin Dashboard (/) ...')
  auditLog.testedPages.push('Admin /')
  await page.waitForTimeout(1500)
  // Click metric cards or any filters
  const adminButtons = await page.locator('button, a.btn-primary, a.btn-secondary').all()
  for (let i = 0; i < Math.min(adminButtons.length, 5); i++) {
    const text = (await adminButtons[i].textContent())?.trim() || `Button #${i}`
    if (!text.toLowerCase().includes('sign out') && !text.toLowerCase().includes('logout')) {
      await safeClick(adminButtons[i], `Dashboard: ${text}`)
    }
  }

  // 2.2 Students Page
  console.log('Auditing /students ...')
  await page.goto(`${BASE_URL}/students`)
  auditLog.testedPages.push('/students')
  await page.waitForTimeout(1200)

  // Search input
  const studentSearch = page.locator('input[placeholder*="Search"], input[type="search"]').first()
  if (await studentSearch.isVisible()) {
    await studentSearch.fill('Aravind')
    await page.waitForTimeout(500)
    await studentSearch.fill('')
  }
  // Click filter buttons/selects
  const studentSelects = await page.locator('select').all()
  for (const sel of studentSelects) {
    const options = await sel.locator('option').all()
    if (options.length > 1) {
      await sel.selectOption({ index: 1 })
      await page.waitForTimeout(400)
      await sel.selectOption({ index: 0 })
    }
  }
  // Modal: Add Student
  const addStudentBtn = page
    .getByRole('button', { name: /add student|enroll/i })
    .or(page.getByRole('link', { name: /add student|enroll/i }))
  if (await addStudentBtn.first().isVisible()) {
    await safeClick(addStudentBtn.first(), 'Open Add/Enroll Student modal/page')
    await page.waitForTimeout(800)
    // If modal, click Cancel or Close
    const closeBtn = page.getByRole('button', { name: /cancel|close|discard/i }).first()
    if (await closeBtn.isVisible()) {
      await safeClick(closeBtn, 'Cancel Add Student modal')
    } else if (page.url().includes('/new') || page.url().includes('/students/')) {
      await page.goto(`${BASE_URL}/students`)
    }
  }

  // 2.3 Invoices Page
  console.log('Auditing /invoices ...')
  await page.goto(`${BASE_URL}/invoices`)
  auditLog.testedPages.push('/invoices')
  await page.waitForTimeout(1200)

  // Search invoice
  const invoiceSearch = page.locator('input[placeholder*="Search"]').first()
  if (await invoiceSearch.isVisible()) {
    await invoiceSearch.fill('INV000001')
    await page.waitForTimeout(500)
    await invoiceSearch.fill('')
  }
  // Click tabs (All, Paid, Partial, etc.)
  const tabBtns = await page
    .getByRole('tab')
    .or(page.locator('.tab-btn, button:has-text("Paid"), button:has-text("All")'))
    .all()
  for (const tab of tabBtns.slice(0, 4)) {
    const label = (await tab.textContent())?.trim()
    await safeClick(tab, `Invoice Filter Tab: ${label}`)
  }
  // Record Payment button
  const recordPayBtn = page.getByRole('button', { name: /record payment|new invoice/i })
  if (await recordPayBtn.first().isVisible()) {
    await safeClick(recordPayBtn.first(), 'Open Record Payment modal')
    await page.waitForTimeout(800)
    const cancelPay = page.getByRole('button', { name: /cancel|close/i }).first()
    if (await cancelPay.isVisible()) {
      await safeClick(cancelPay, 'Close Record Payment modal')
    }
  }
  // Click view invoice
  const viewInvoiceBtn = page.getByRole('button', { name: /view|receipt|details/i }).first()
  if (await viewInvoiceBtn.isVisible()) {
    await safeClick(viewInvoiceBtn, 'View Invoice Details/Receipt')
    await page.waitForTimeout(800)
    const closeInv = page.getByRole('button', { name: /close|cancel/i }).first()
    if (await closeInv.isVisible()) {
      await safeClick(closeInv, 'Close Invoice details modal')
    }
  }

  // 2.4 Courses Page
  console.log('Auditing /courses ...')
  await page.goto(`${BASE_URL}/courses`)
  auditLog.testedPages.push('/courses')
  await page.waitForTimeout(1200)

  const newCourseBtn = page
    .getByRole('button', { name: /add course|new course/i })
    .or(page.getByRole('link', { name: /add course|new course/i }))
  if (await newCourseBtn.first().isVisible()) {
    await safeClick(newCourseBtn.first(), 'Open Add Course modal/page')
    await page.waitForTimeout(800)
    const closeCourse = page.getByRole('button', { name: /cancel|close/i }).first()
    if (await closeCourse.isVisible()) {
      await safeClick(closeCourse, 'Close Add Course modal')
    } else if (page.url().includes('/new')) {
      await page.goto(`${BASE_URL}/courses`)
    }
  }

  // 2.5 Course Materials Page
  console.log('Auditing /materials ...')
  await page.goto(`${BASE_URL}/materials`)
  auditLog.testedPages.push('/materials')
  await page.waitForTimeout(1200)

  const uploadMaterialBtn = page.getByRole('button', { name: /upload|new material|add material/i })
  if (await uploadMaterialBtn.first().isVisible()) {
    await safeClick(uploadMaterialBtn.first(), 'Open Upload Material modal')
    await page.waitForTimeout(800)
    const closeMat = page.getByRole('button', { name: /cancel|close/i }).first()
    if (await closeMat.isVisible()) {
      await safeClick(closeMat, 'Close Upload Material modal')
    }
  }

  // 2.6 Certificates Page
  console.log('Auditing /certificates ...')
  await page.goto(`${BASE_URL}/certificates`)
  auditLog.testedPages.push('/certificates')
  await page.waitForTimeout(1200)

  const issueCertBtn = page.getByRole('button', { name: /issue certificate|new certificate/i })
  if (await issueCertBtn.first().isVisible()) {
    await safeClick(issueCertBtn.first(), 'Open Issue Certificate modal')
    await page.waitForTimeout(800)
    const closeCert = page.getByRole('button', { name: /cancel|close/i }).first()
    if (await closeCert.isVisible()) {
      await safeClick(closeCert, 'Close Issue Certificate modal')
    }
  }

  // 2.7 Attendance Page
  console.log('Auditing /attendance ...')
  await page.goto(`${BASE_URL}/attendance`)
  auditLog.testedPages.push('/attendance')
  await page.waitForTimeout(1200)

  // Click load roster or batch selection
  const loadRosterBtn = page.getByRole('button', { name: /load roster/i })
  if (await loadRosterBtn.isVisible()) {
    await safeClick(loadRosterBtn, 'Load attendance roster button')
    await page.waitForTimeout(800)
  }

  // Toggle student status button (Present/Absent)
  const attendanceToggle = page
    .locator('button:has-text("Present"), button:has-text("Absent"), button:has-text("P"), button:has-text("A")')
    .first()
  if (await attendanceToggle.isVisible()) {
    await safeClick(attendanceToggle, 'Toggle Student Attendance status button')
  }

  // Save attendance
  const saveAttendanceBtn = page.getByRole('button', { name: /save attendance|submit/i })
  if (await saveAttendanceBtn.isVisible()) {
    await safeClick(saveAttendanceBtn, 'Save attendance button')
    await page.waitForTimeout(1000)
  }

  // 2.8 Assessments Page
  console.log('Auditing /assessments ...')
  await page.goto(`${BASE_URL}/assessments`)
  auditLog.testedPages.push('/assessments')
  await page.waitForTimeout(1200)

  const newAssessmentBtn = page.getByRole('button', { name: /new assessment|create assessment|add assessment/i })
  if (await newAssessmentBtn.first().isVisible()) {
    await safeClick(newAssessmentBtn.first(), 'Open Create Assessment modal')
    await page.waitForTimeout(800)
    const closeAss = page.getByRole('button', { name: /cancel|close/i }).first()
    if (await closeAss.isVisible()) {
      await safeClick(closeAss, 'Close Create Assessment modal')
    }
  }

  // Click on an assessment card/row
  const assessmentRow = page.locator('a[href*="/assessments/"], button:has-text("View"), tr:has-text("MERN")').first()
  if (await assessmentRow.isVisible()) {
    await safeClick(assessmentRow, 'Open Assessment Details/Grading')
    await page.waitForTimeout(1000)
    await page.goto(`${BASE_URL}/assessments`)
  }

  // 2.9 Reports Page
  console.log('Auditing /reports ...')
  await page.goto(`${BASE_URL}/reports`)
  auditLog.testedPages.push('/reports')
  await page.waitForTimeout(1200)

  // Click date toggles / export buttons
  const exportBtn = page.getByRole('button', { name: /export|download|print/i }).first()
  if (await exportBtn.isVisible()) {
    await safeClick(exportBtn, 'Reports Export button')
  }

  // 2.10 Audit Log Page
  console.log('Auditing /audit-log ...')
  await page.goto(`${BASE_URL}/audit-log`)
  auditLog.testedPages.push('/audit-log')
  await page.waitForTimeout(1200)

  const logFilters = await page.locator('select').all()
  for (const sel of logFilters) {
    const opts = await sel.locator('option').all()
    if (opts.length > 1) {
      await sel.selectOption({ index: 1 })
      await page.waitForTimeout(400)
      await sel.selectOption({ index: 0 })
    }
  }

  // 2.11 Settings: Brand
  console.log('Auditing /settings/brand ...')
  await page.goto(`${BASE_URL}/settings/brand`)
  auditLog.testedPages.push('/settings/brand')
  await page.waitForTimeout(1200)

  const saveBrandBtn = page.getByRole('button', { name: /save changes|save brand|update/i }).first()
  if (await saveBrandBtn.isVisible()) {
    await safeClick(saveBrandBtn, 'Save Brand Information button')
    await page.waitForTimeout(1000)
  }

  // 2.12 Settings: Users & Roles
  console.log('Auditing /settings/users ...')
  await page.goto(`${BASE_URL}/settings/users`)
  auditLog.testedPages.push('/settings/users')
  await page.waitForTimeout(1200)

  // Check Generate Passcode / Invite button
  const genPasscodeBtn = page.getByRole('button', { name: /generate|passcode|invite|create code/i }).first()
  if (await genPasscodeBtn.isVisible()) {
    await safeClick(genPasscodeBtn, 'Open Generate Passcode modal')
    await page.waitForTimeout(800)
    const closePasscode = page.getByRole('button', { name: /cancel|close/i }).first()
    if (await closePasscode.isVisible()) {
      await safeClick(closePasscode, 'Close Generate Passcode modal')
    }
  }

  // Check Copy Code button
  const copyBtn = page.getByRole('button', { name: /copy/i }).first()
  if (await copyBtn.isVisible()) {
    await safeClick(copyBtn, 'Copy Invite Passcode button')
  }

  // 2.13 Settings: GST Settings
  console.log('Auditing /settings/gst ...')
  await page.goto(`${BASE_URL}/settings/gst`)
  auditLog.testedPages.push('/settings/gst')
  await page.waitForTimeout(1200)

  // 2.14 Settings: Instructor Assignments
  console.log('Auditing /settings/trainers ...')
  await page.goto(`${BASE_URL}/settings/trainers`)
  auditLog.testedPages.push('/settings/trainers')
  await page.waitForTimeout(1200)

  // 2.15 Settings: Course Categories
  console.log('Auditing /settings/course-categories ...')
  await page.goto(`${BASE_URL}/settings/course-categories`)
  auditLog.testedPages.push('/settings/course-categories')
  await page.waitForTimeout(1200)

  // Sign out as Admin
  console.log('Admin phase completed. Closing admin context...')
  await context.close()

  // ==========================================
  // PHASE 3: STAFF ROLE AUDIT (ISOLATED CONTEXT)
  // ==========================================
  console.log('\n--- PHASE 3: STAFF ROLE AUDIT ---')
  const staffContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1440, height: 900 },
    },
  })
  const staffPage = await staffContext.newPage()

  staffPage.on('pageerror', (err) => {
    console.error('❌ Staff Page Error:', err.message)
    auditLog.pageErrors.push({ url: staffPage.url(), message: err.message })
  })

  async function safeStaffClick(selectorOrLocator, description) {
    try {
      const loc =
        typeof selectorOrLocator === 'string' ? staffPage.locator(selectorOrLocator).first() : selectorOrLocator
      if (await loc.isVisible({ timeout: 2500 })) {
        await loc.click({ timeout: 2500 })
        auditLog.clickedButtons.push(`Staff: ${description}`)
        console.log(`  ✓ Clicked (Staff): ${description}`)
        await staffPage.waitForTimeout(500)
        return true
      }
    } catch (e) {
      console.log(`  - Skipped/Timeout (Staff): ${description}`)
    }
    return false
  }

  await staffPage.goto(`${BASE_URL}/login`)
  await staffPage.locator('input[name="email"], input[type="email"]').fill('staff@thoorigai.test')
  await staffPage.locator('input[name="password"], input[type="password"]').fill('ThoorigaiLocal123!')
  await safeStaffClick('button[type="submit"]', 'Staff Sign In button')
  await staffPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
  console.log('✓ Staff successfully logged in!')

  // 3.1 Staff Dashboard
  console.log('Auditing Staff Dashboard (/) ...')
  auditLog.testedPages.push('Staff /')
  await staffPage.waitForTimeout(1500)

  const staffButtons = await staffPage.locator('button, a.btn-primary, a.btn-secondary').all()
  for (let i = 0; i < Math.min(staffButtons.length, 5); i++) {
    const text = (await staffButtons[i].textContent())?.trim() || `Staff Button #${i}`
    if (!text.toLowerCase().includes('sign out') && !text.toLowerCase().includes('logout')) {
      await safeStaffClick(staffButtons[i], text)
    }
  }

  // 3.2 Staff Students page
  console.log('Auditing Staff /students ...')
  await staffPage.goto(`${BASE_URL}/students`)
  auditLog.testedPages.push('Staff /students')
  await staffPage.waitForTimeout(1000)

  // 3.3 Staff Attendance
  console.log('Auditing Staff /attendance ...')
  await staffPage.goto(`${BASE_URL}/attendance`)
  auditLog.testedPages.push('Staff /attendance')
  await staffPage.waitForTimeout(1000)

  // 3.4 Staff Assessments
  console.log('Auditing Staff /assessments ...')
  await staffPage.goto(`${BASE_URL}/assessments`)
  auditLog.testedPages.push('Staff /assessments')
  await staffPage.waitForTimeout(1000)

  // 3.5 Staff Materials
  console.log('Auditing Staff /materials ...')
  await staffPage.goto(`${BASE_URL}/materials`)
  auditLog.testedPages.push('Staff /materials')
  await staffPage.waitForTimeout(1000)

  // 3.6 Staff RBAC boundary check: Try accessing Admin Brand Settings
  console.log('Testing Staff Access Control Boundary (/settings/brand) ...')
  await staffPage.goto(`${BASE_URL}/settings/brand`)
  await staffPage.waitForTimeout(1500)
  const currentUrl = staffPage.url()
  console.log(`Staff navigated to /settings/brand -> current URL: ${currentUrl}`)
  if (currentUrl.endsWith('/settings/brand')) {
    auditLog.uxObservations.push('Security Warning: Staff user was able to reach /settings/brand without redirect')
  } else {
    console.log('✓ RBAC Enforcement Verified: Staff redirected away from /settings/brand!')
  }

  // Final wrap-up
  await staffPage.waitForTimeout(2000)
  await staffContext.close()
  await browser.close()

  console.log('\n🎉 AUDIT COMPLETE!')
  console.log(`Total Pages Audited: ${auditLog.testedPages.length}`)
  console.log(`Total Buttons/Actions Clicked: ${auditLog.clickedButtons.length}`)
  console.log(`Page Errors: ${auditLog.pageErrors.length}`)
  console.log(`Console Errors: ${auditLog.consoleErrors.length}`)
  console.log(`Network Failures: ${auditLog.networkErrors.length}`)

  // Write detailed audit result JSON
  const auditResultPath = path.resolve(RECORDINGS_DIR, 'audit-results.json')
  fs.writeFileSync(auditResultPath, JSON.stringify(auditLog, null, 2))
  console.log(`Report written to: ${auditResultPath}`)
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err)
  process.exit(1)
})
