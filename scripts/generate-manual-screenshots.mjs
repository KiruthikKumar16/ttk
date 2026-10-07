import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:3005'
const ADMIN_DIR = path.resolve('docs/manuals/screenshots/admin')
const STAFF_DIR = path.resolve('docs/manuals/screenshots/staff')

fs.mkdirSync(ADMIN_DIR, { recursive: true })
fs.mkdirSync(STAFF_DIR, { recursive: true })

async function annotate(page, targets) {
  await page.evaluate(() => {
    document.querySelectorAll('.doc-step-marker').forEach((e) => e.remove())
    document.querySelectorAll('[data-doc-highlight]').forEach((e) => {
      e.style.outline = ''
      e.style.boxShadow = ''
      e.removeAttribute('data-doc-highlight')
    })
  })

  for (const { selector, step, position = 'top-left', label } of targets) {
    try {
      const loc = selector.startsWith('text=')
        ? page.getByText(selector.replace('text=', '')).first()
        : page.locator(selector).first()

      if (!(await loc.isVisible({ timeout: 2000 }))) continue

      const box = await loc.boundingBox()
      if (!box) continue

      await loc.evaluate((el) => {
        el.setAttribute('data-doc-highlight', 'true')
        el.style.outline = '3px solid #e11d48'
        el.style.outlineOffset = '2px'
        el.style.borderRadius = '4px'
      })

      let top = box.y
      let left = box.x

      if (position === 'top-left') {
        top -= 12
        left -= 12
      } else if (position === 'top-right') {
        top -= 12
        left += box.width - 16
      } else if (position === 'bottom-left') {
        top += box.height - 12
        left -= 12
      } else if (position === 'center') {
        top += box.height / 2 - 14
        left += box.width / 2 - 14
      }

      await page.evaluate(
        ({ top, left, step, label }) => {
          const wrapper = document.createElement('div')
          wrapper.className = 'doc-step-marker'
          wrapper.innerHTML = `
          <div style="
            position: absolute;
            top: ${top + window.scrollY}px;
            left: ${left + window.scrollX}px;
            z-index: 9999999;
            display: flex;
            align-items: center;
            gap: 6px;
            pointer-events: none;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <div style="
              background: #e11d48;
              color: #ffffff;
              font-size: 13px;
              font-weight: 800;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 0 3px #ffffff, 0 3px 8px rgba(0,0,0,0.5);
              border: 2px solid #be123c;
            ">${step}</div>
            ${
              label
                ? `<div style="
              background: #0f172a;
              color: #f8fafc;
              font-size: 11px;
              font-weight: 700;
              padding: 3px 7px;
              border-radius: 5px;
              border: 1px solid rgba(255,255,255,0.25);
              white-space: nowrap;
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            ">${label}</div>`
                : ''
            }
          </div>
        `
          document.body.appendChild(wrapper)
        },
        { top, left, step, label },
      )
    } catch (e) {
      console.warn(`Could not annotate target [${step}]: ${selector}`, e.message)
    }
  }
}

async function run() {
  console.log('🚀 Starting Comprehensive A-to-Z Screenshot Capture Engine...')
  const browser = await chromium.launch({ headless: true })

  // ----------------------------------------------------
  // SECTION A: PUBLIC & ONBOARDING
  // ----------------------------------------------------
  const publicPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // 1. Login Page
  await publicPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await annotate(publicPage, [
    { selector: 'input[type="email"]', step: 1, label: 'Work Email Address' },
    { selector: 'input[type="password"]', step: 2, label: 'Account Password' },
    { selector: 'button[type="submit"]', step: 3, label: 'Sign In CTA' },
  ])
  await publicPage.screenshot({ path: path.join(ADMIN_DIR, '01_login.png') })
  await publicPage.screenshot({ path: path.join(STAFF_DIR, '01_login.png') })
  console.log('✓ Captured 01_login.png')

  // 2. Signup Page with Passcode
  await publicPage.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' })
  await annotate(publicPage, [
    { selector: 'input[name="fullName"], input[placeholder*="name" i]', step: 1, label: 'Full Legal Name' },
    { selector: 'input[name="email"], input[type="email"]', step: 2, label: 'Work Email' },
    { selector: 'input[name="password"], input[type="password"]', step: 3, label: 'Create Password' },
    { selector: 'button:has-text("code"), button:has-text("passcode")', step: 4, label: 'Enter OTP Code' },
  ])
  await publicPage.screenshot({ path: path.join(STAFF_DIR, '02_signup_onboarding.png') })
  console.log('✓ Captured 02_signup_onboarding.png')

  // 3. Public Verify Portal
  await publicPage.goto(`${BASE_URL}/verify`, { waitUntil: 'networkidle' })
  await annotate(publicPage, [
    { selector: 'input[type="text"]', step: 1, label: 'Enter Certificate ID (e.g. VREF-...)' },
    { selector: 'button:has-text("Verify")', step: 2, label: 'Verify Credential' },
  ])
  await publicPage.screenshot({ path: path.join(ADMIN_DIR, '19_verify_public_portal.png') })
  console.log('✓ Captured 19_verify_public_portal.png')

  await publicPage.close()

  // ----------------------------------------------------
  // SECTION B: ADMIN FULL WORKFLOWS
  // ----------------------------------------------------
  console.log('\n--- Capturing All Admin Workflows ---')
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await adminContext.newPage()

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill('admin@thoorigai.test')
  await page.locator('input[type="password"]').fill('ThoorigaiLocal123!')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForTimeout(2000)

  // 1. Executive Dashboard (Financial Tab)
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await annotate(page, [
    {
      selector: 'a[href="/students"]:has-text("Add"), a.btn-primary:has-text("student")',
      step: 1,
      label: 'Add Student CTA',
    },
    { selector: '.stats-grid', step: 2, label: 'Executive Revenue & Due KPIs' },
    {
      selector: 'button:has-text("Staff & Academic"), [role="tab"]:has-text("Staff")',
      step: 3,
      label: 'Toggle Academic Tab',
    },
    { selector: 'aside.sidebar', step: 4, label: 'Master Navigation Sidebar' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '02_executive_dashboard.png') })
  console.log('✓ Captured 02_executive_dashboard.png')

  // 2. Dashboard Academic Tab View
  const acadTab = page.locator('button:has-text("Staff & Academic"), [role="tab"]:has-text("Academic")').first()
  if (await acadTab.isVisible()) {
    await acadTab.click()
    await page.waitForTimeout(600)
    await annotate(page, [{ selector: '.stats-grid, table', step: 1, label: 'Academic & Cohort Analytics' }])
    await page.screenshot({ path: path.join(ADMIN_DIR, '03_dashboard_academic_tab.png') })
    console.log('✓ Captured 03_dashboard_academic_tab.png')
  }

  // 3. Topbar Notifications & Global Search
  const notifBtn = page.locator('button[aria-label*="notification" i], button:has(svg.lucide-bell)').first()
  if (await notifBtn.isVisible()) {
    await notifBtn.click()
    await page.waitForTimeout(600)
    await annotate(page, [
      { selector: 'input[placeholder*="Search" i]', step: 1, label: 'Global Instant Search' },
      {
        selector: 'div[role="menu"], .notification-panel, [data-state="open"]',
        step: 2,
        label: 'Notifications Center',
      },
      { selector: 'a[href="/settings/user"], button:has-text("Settings")', step: 3, label: 'Account Settings' },
      { selector: 'button:has-text("Sign out"), a[href*="logout"]', step: 4, label: 'Secure Sign Out' },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '29_topbar_notifications.png') })
    console.log('✓ Captured 29_topbar_notifications.png')
    // Close panel
    await page.keyboard.press('Escape')
  }

  // 4. Users & Roles Roster
  await page.goto(`${BASE_URL}/settings/users`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    {
      selector: 'button:has-text("Generate Invite Code"), button:has-text("New Code")',
      step: 1,
      label: 'Generate OTP Passcode',
    },
    { selector: 'table, .user-list', step: 2, label: 'User Directory & Roster' },
    { selector: 'button:has-text("Approve as Admin")', step: 3, label: 'Approve as Admin' },
    { selector: 'button:has-text("Approve as Staff")', step: 4, label: 'Approve as Staff' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '04_users_and_roles.png') })
  console.log('✓ Captured 04_users_and_roles.png')

  // 5. Generate Invite Modal
  const genBtn = page.locator('button:has-text("Generate Invite Code"), button:has-text("New Code")').first()
  if (await genBtn.isVisible()) {
    await genBtn.click()
    await page.locator('h3:has-text("Generate Invite Code")').waitFor({ timeout: 5000 })
    await page.waitForTimeout(500)
    await annotate(page, [
      { selector: 'button:has-text("Staff Access")', step: 1, label: 'Staff Role (STAFF-XXXX)' },
      { selector: 'button:has-text("Admin Access")', step: 2, label: 'Admin Role (ADMIN-XXXX)' },
      { selector: 'select#invite-expiry-select', step: 3, label: 'Expiration Period (1h - 7d)' },
      { selector: 'input[placeholder*="rajesh@"]', step: 4, label: 'Email Restriction (Optional)' },
      { selector: 'button[type="submit"]:has-text("Generate")', step: 5, label: 'Confirm & Generate Code' },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '05_invite_modal.png') })
    console.log('✓ Captured 05_invite_modal.png')
    const closeBtn = page.locator('button:has-text("Cancel")').first()
    if (await closeBtn.isVisible()) await closeBtn.click()
  }

  // 6. User Details & Danger Zone Modal
  const settingsInfoBtn = page.locator('button:has-text("Settings & Info"), button[title*="Settings"]').first()
  if (await settingsInfoBtn.isVisible()) {
    await settingsInfoBtn.click()
    await page.waitForTimeout(800)
    await annotate(page, [
      { selector: 'input[placeholder*="+91" i]', step: 1, label: 'Contact Phone Numbers' },
      {
        selector: 'button:has-text("View User Log"), a:has-text("View User Log")',
        step: 2,
        label: 'Deep Link to Audit Log',
      },
      {
        selector: 'button:has-text("Revoke Access"), button:has-text("Set Pending")',
        step: 3,
        label: 'Revoke Access (Set Pending)',
      },
      { selector: 'button:has-text("Remove User")', step: 4, label: 'Permanently Delete User' },
      { selector: 'button[type="submit"]:has-text("Save")', step: 5, label: 'Save Profile Changes' },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '06_user_edit_modal.png') })
    console.log('✓ Captured 06_user_edit_modal.png')
    const closeUserModal = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first()
    if (await closeUserModal.isVisible()) await closeUserModal.click()
  }

  // 7. Students Directory
  await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'input[placeholder*="Search" i]', step: 1, label: 'Filter by Name / Register ID' },
    { selector: 'button:has-text("Add student"), a:has-text("Add student")', step: 2, label: 'Enroll New Student CTA' },
    { selector: 'table', step: 3, label: 'Master Student Registry' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '07_students_directory.png') })
  console.log('✓ Captured 07_students_directory.png')

  // 8. Add Student Modal
  const addStudentBtn = page.locator('button:has-text("Add student"), a:has-text("Add student")').first()
  if (await addStudentBtn.isVisible()) {
    await addStudentBtn.click()
    await page.waitForTimeout(800)
    await annotate(page, [
      { selector: 'input[name="name"], input[placeholder*="Name" i]', step: 1, label: 'Student Legal Name' },
      { selector: 'select, [role="combobox"]', step: 2, label: 'Course Selection & Fee Auto-fill' },
      { selector: 'input[type="date"]', step: 3, label: 'Batch Start Date' },
      { selector: 'input[placeholder*="Phone" i]', step: 4, label: 'Student & Guardian Contact' },
      {
        selector: 'button[type="submit"]:has-text("Save"), button:has-text("Add")',
        step: 5,
        label: 'Create Record & Issue Bill',
      },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '08_add_student_modal.png') })
    console.log('✓ Captured 08_add_student_modal.png')
    const closeStudent = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first()
    if (await closeStudent.isVisible()) await closeStudent.click()
  }

  // 9. Invoices Ledger
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'button:has-text("Record"), a:has-text("Record")', step: 1, label: 'Record Fee Payment CTA' },
    {
      selector: 'button:has-text("All"), button:has-text("Paid"), button:has-text("Overdue")',
      step: 2,
      label: 'Billing Status Tabs',
    },
    { selector: 'table', step: 3, label: 'GST Tax Invoices Table' },
    {
      selector: 'button:has-text("Download"), button[aria-label*="download" i]',
      step: 4,
      label: 'Download PDF Invoice',
    },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '09_invoices_ledger.png') })
  console.log('✓ Captured 09_invoices_ledger.png')

  // 10. Record Payment Modal
  const recPayBtn = page.locator('button:has-text("Record"), a:has-text("Record")').first()
  if (await recPayBtn.isVisible()) {
    await recPayBtn.click()
    await page.waitForTimeout(800)
    await annotate(page, [
      { selector: 'select, input[placeholder*="student" i]', step: 1, label: 'Select Student Debtor' },
      { selector: 'input[type="number"], input[placeholder*="Amount" i]', step: 2, label: 'Installment Amount (INR)' },
      {
        selector: 'select:has-text("UPI"), select:has-text("Cash"), select[name*="mode" i]',
        step: 3,
        label: 'Mode (UPI / Cash / Bank)',
      },
      { selector: 'input[placeholder*="UTR"], input[placeholder*="ref" i]', step: 4, label: 'Transaction Reference #' },
      {
        selector: 'button[type="submit"]:has-text("Record"), button[type="submit"]:has-text("Save")',
        step: 5,
        label: 'Save Payment & Update Dues',
      },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '10_record_payment_modal.png') })
    console.log('✓ Captured 10_record_payment_modal.png')
    const closePay = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first()
    if (await closePay.isVisible()) await closePay.click()
  }

  // 11. Courses Catalog
  await page.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    {
      selector: 'button:has-text("Create"), button:has-text("New Course"), a:has-text("New Course")',
      step: 1,
      label: 'Add New Course CTA',
    },
    { selector: '.courses-grid, table, .grid', step: 2, label: 'Course Catalog & Pricing' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '11_courses_catalog.png') })
  console.log('✓ Captured 11_courses_catalog.png')

  // 12. Create Course Modal
  const createCourseBtn = page
    .locator('button:has-text("Create"), button:has-text("New Course"), a:has-text("New Course")')
    .first()
  if (await createCourseBtn.isVisible()) {
    await createCourseBtn.click()
    await page.waitForTimeout(800)
    await annotate(page, [
      { selector: 'input[name="title"], input[placeholder*="Title" i]', step: 1, label: 'Course Name' },
      { selector: 'input[name="code"], input[placeholder*="Code" i]', step: 2, label: 'Short Code (e.g. FS-MERN)' },
      { selector: 'select', step: 3, label: 'Category Tier (Elite / Essential)' },
      { selector: 'input[type="number"], input[placeholder*="Fee" i]', step: 4, label: 'Standard Tuition Fee' },
      {
        selector: 'button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")',
        step: 5,
        label: 'Publish to Catalog',
      },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '12_create_course_modal.png') })
    console.log('✓ Captured 12_create_course_modal.png')
    const closeCourse = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first()
    if (await closeCourse.isVisible()) await closeCourse.click()
  }

  // 13. Course Materials
  await page.goto(`${BASE_URL}/materials`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'select, [role="combobox"]', step: 1, label: 'Course Module Filter' },
    { selector: 'button:has-text("Upload"), input[type="file"]', step: 2, label: 'Upload Materials CTA' },
    { selector: 'table, .materials-list', step: 3, label: 'Uploaded Digital Files' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '13_course_materials.png') })
  console.log('✓ Captured 13_course_materials.png')

  // 14. Attendance Tracker
  await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'select, input[type="date"]', step: 1, label: 'Batch & Session Date' },
    {
      selector: 'button:has-text("Present"), button:has-text("All Present")',
      step: 2,
      label: 'Bulk "Mark All Present"',
    },
    { selector: 'table, .attendance-grid', step: 3, label: 'Roll-Call Roster' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '14_attendance_tracker.png') })
  console.log('✓ Captured 14_attendance_tracker.png')

  // 15. Assessments Studio
  await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'button:has-text("Create"), button:has-text("New Assessment")', step: 1, label: 'New Test CTA' },
    { selector: 'button:has-text("Google Forms"), button:has-text("Import")', step: 2, label: 'Import Google Forms' },
    { selector: 'button:has-text("Grade"), a:has-text("Grade")', step: 3, label: 'Open Grading Studio' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '15_assessments_studio.png') })
  console.log('✓ Captured 15_assessments_studio.png')

  // 16. Google Forms Modal
  const gFormsBtn = page.locator('button:has-text("Google Forms"), button:has-text("Import")').first()
  if (await gFormsBtn.isVisible()) {
    await gFormsBtn.click()
    await page.waitForTimeout(800)
    await annotate(page, [
      { selector: 'input[placeholder*="docs.google.com/forms"]', step: 1, label: 'Google Form URL' },
      { selector: 'input[placeholder*="docs.google.com/spreadsheets"]', step: 2, label: 'Google Sheet Responses URL' },
      { selector: 'select', step: 3, label: 'Map to Course' },
      {
        selector: 'button[type="submit"]:has-text("Import"), button:has-text("Sync")',
        step: 4,
        label: 'Import Scores',
      },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '16_google_forms_modal.png') })
    console.log('✓ Captured 16_google_forms_modal.png')
    const closeGForms = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first()
    if (await closeGForms.isVisible()) await closeGForms.click()
  }

  // 17. Grading Studio
  const gradeBtn = page.locator('button:has-text("Grade"), a:has-text("Grade")').first()
  if (await gradeBtn.isVisible()) {
    await gradeBtn.click()
    await page.waitForTimeout(800)
    await annotate(page, [
      { selector: 'input[type="number"], input[placeholder*="score" i]', step: 1, label: 'Enter Score / Marks' },
      { selector: 'textarea, input[placeholder*="feedback" i]', step: 2, label: 'Qualitative Feedback Remarks' },
      {
        selector: 'button:has-text("Save"), button:has-text("Submit Grade")',
        step: 3,
        label: 'Save Student Evaluation',
      },
      {
        selector: 'button[title*="Delete"], button[aria-label*="delete" i]',
        step: 4,
        label: 'Delete Single Submission',
      },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '17_grading_studio.png') })
    console.log('✓ Captured 17_grading_studio.png')
  }

  // 18. Certificates Issuance
  await page.goto(`${BASE_URL}/certificates`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'button:has-text("Issue"), button:has-text("Generate")', step: 1, label: 'Issue Certificate CTA' },
    { selector: 'table, .cert-list', step: 2, label: 'Eligible & Issued Registry' },
    {
      selector: 'button:has-text("Download"), a:has-text("Download")',
      step: 3,
      label: 'Download Official PDF with QR',
    },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '18_certificates_issuance.png') })
  console.log('✓ Captured 18_certificates_issuance.png')

  // 20. Reports Financial
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    {
      selector: 'button:has-text("Financial"), [role="tab"]:has-text("Financial")',
      step: 1,
      label: 'Financial Revenue Reports',
    },
    { selector: 'button:has-text("Export"), button:has-text("CSV")', step: 2, label: 'Export Accounting CSV' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '20_reports_financial.png') })
  console.log('✓ Captured 20_reports_financial.png')

  // 21. Reports Academic
  const acadReportBtn = page.locator('button:has-text("Academic"), [role="tab"]:has-text("Academic")').first()
  if (await acadReportBtn.isVisible()) {
    await acadReportBtn.click()
    await page.waitForTimeout(600)
    await annotate(page, [
      { selector: '.stats-grid, table', step: 1, label: 'Pass Rates & Attendance Stats' },
      { selector: 'button:has-text("Export"), button:has-text("CSV")', step: 2, label: 'Export Academic CSV' },
    ])
    await page.screenshot({ path: path.join(ADMIN_DIR, '21_reports_academic.png') })
    console.log('✓ Captured 21_reports_academic.png')
  }

  // 22. Audit Log
  await page.goto(`${BASE_URL}/audit-log`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'input[placeholder*="Search" i], select', step: 1, label: 'Search User / Correlation ID' },
    { selector: 'table, .audit-table', step: 2, label: 'Immutable Audit Trail' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '22_audit_log.png') })
  console.log('✓ Captured 22_audit_log.png')

  // 23. GST Settings
  await page.goto(`${BASE_URL}/settings/gst`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'input[name*="gstin" i], input', step: 1, label: '15-Digit GSTIN Number' },
    { selector: 'button:has-text("Save")', step: 2, label: 'Save Tax Parameters' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '23_gst_settings.png') })
  console.log('✓ Captured 23_gst_settings.png')

  // 24. Brand Settings
  await page.goto(`${BASE_URL}/settings/brand`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'input[name*="name" i], input', step: 1, label: 'Academy Name & Contact' },
    { selector: 'button:has-text("Save")', step: 2, label: 'Save Brand Information' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '24_brand_settings.png') })
  console.log('✓ Captured 24_brand_settings.png')

  // 25. Instructor Assignments
  await page.goto(`${BASE_URL}/settings/trainers`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'select, [role="combobox"]', step: 1, label: 'Assign Trainer to Course' },
    { selector: 'button:has-text("Save")', step: 2, label: 'Save Instructor Mappings' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '25_instructor_assignments.png') })
  console.log('✓ Captured 25_instructor_assignments.png')

  // 26. Course Categories
  await page.goto(`${BASE_URL}/settings/course-categories`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'button:has-text("Add"), button:has-text("Create")', step: 1, label: 'Add New Category' },
    { selector: 'table', step: 2, label: 'Course Categories (Elite/Essential)' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '26_course_categories.png') })
  console.log('✓ Captured 26_course_categories.png')

  // 27. Skill Tags
  await page.goto(`${BASE_URL}/settings/skills`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'button:has-text("Add"), input[placeholder*="skill" i]', step: 1, label: 'Add Skill Tag' },
    { selector: '.skills-list, table, .flex-wrap', step: 2, label: 'Competencies Taxonomy' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '27_skill_tags.png') })
  console.log('✓ Captured 27_skill_tags.png')

  // 28. User Settings
  await page.goto(`${BASE_URL}/settings/user`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await annotate(page, [
    { selector: 'input[name*="name" i], input[type="text"]', step: 1, label: 'Update Display Name' },
    { selector: 'input[type="password"]', step: 2, label: 'Change Password' },
    { selector: 'button:has-text("Save"), button:has-text("Update")', step: 3, label: 'Save User Settings' },
  ])
  await page.screenshot({ path: path.join(ADMIN_DIR, '28_user_settings.png') })
  console.log('✓ Captured 28_user_settings.png')

  await adminContext.close()

  // ----------------------------------------------------
  // SECTION C: STAFF WORKFLOWS
  // ----------------------------------------------------
  console.log('\n--- Capturing All Staff Workflows ---')
  const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const staffPage = await staffContext.newPage()

  await staffPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await staffPage.locator('input[type="email"]').fill('staff@thoorigai.test')
  await staffPage.locator('input[type="password"]').fill('ThoorigaiLocal123!')
  await staffPage.locator('button[type="submit"]').click()
  await staffPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await staffPage.waitForTimeout(2000)

  // 1. Staff Dashboard
  await staffPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: '.stats-grid', step: 1, label: 'Classroom Operations Summary' },
    { selector: 'aside.sidebar', step: 2, label: 'Staff Permitted Navigation' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '03_staff_dashboard.png') })
  console.log('✓ Captured 03_staff_dashboard.png')

  // 2. Staff Students
  await staffPage.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: 'input[placeholder*="Search" i]', step: 1, label: 'Search Batch Students' },
    { selector: 'table', step: 2, label: 'Classroom Student Roster' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '04_staff_students.png') })
  console.log('✓ Captured 04_staff_students.png')

  // 3. Staff Attendance
  await staffPage.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: 'select, input[type="date"]', step: 1, label: 'Select Batch & Date' },
    {
      selector: 'button:has-text("Present"), button:has-text("All Present")',
      step: 2,
      label: 'One-Click Mark All Present',
    },
    { selector: 'table', step: 3, label: 'Daily Roll-Call Grid' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '05_staff_attendance.png') })
  console.log('✓ Captured 05_staff_attendance.png')

  // 4. Staff Assessments
  await staffPage.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: 'button:has-text("Create"), button:has-text("New Assessment")', step: 1, label: 'New Test CTA' },
    {
      selector: 'button:has-text("Google Forms"), button:has-text("Import")',
      step: 2,
      label: 'Import Google Form Responses',
    },
    { selector: 'button:has-text("Grade"), a:has-text("Grade")', step: 3, label: 'Enter Grading Studio' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '06_staff_assessments.png') })
  console.log('✓ Captured 06_staff_assessments.png')

  // 5. Staff Materials
  await staffPage.goto(`${BASE_URL}/materials`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: 'select', step: 1, label: 'Select Target Course Module' },
    { selector: 'button:has-text("Upload"), input[type="file"]', step: 2, label: 'Upload Lesson Materials' },
    { selector: 'table', step: 3, label: 'Classroom Files Roster' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '07_staff_materials.png') })
  console.log('✓ Captured 07_staff_materials.png')

  // 6. Staff Academic Reports
  await staffPage.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: '.stats-grid, table', step: 1, label: 'Pass Rates & Assessment Averages' },
    { selector: 'button:has-text("Export"), button:has-text("CSV")', step: 2, label: 'Download Roster Scores CSV' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '08_staff_academic_reports.png') })
  console.log('✓ Captured 08_staff_academic_reports.png')

  // 7. Staff Settings
  await staffPage.goto(`${BASE_URL}/settings/user`, { waitUntil: 'networkidle' })
  await annotate(staffPage, [
    { selector: 'input[name*="name" i], input[type="text"]', step: 1, label: 'Instructor Profile' },
    { selector: 'input[type="password"]', step: 2, label: 'Change Password' },
    { selector: 'button:has-text("Save"), button:has-text("Update")', step: 3, label: 'Update Credentials' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '09_staff_settings.png') })
  console.log('✓ Captured 09_staff_settings.png')

  await staffContext.close()
  await browser.close()
  console.log('\n🎉 ALL 38 Screenshots across both roles captured and annotated!')
}

run().catch((err) => {
  console.error('Fatal error during comprehensive capture:', err)
  process.exit(1)
})
