import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:3005'
const ADMIN_DIR = path.resolve('docs/manuals/screenshots/admin')
const STAFF_DIR = path.resolve('docs/manuals/screenshots/staff')

fs.mkdirSync(ADMIN_DIR, { recursive: true })
fs.mkdirSync(STAFF_DIR, { recursive: true })

async function annotate(page, targets) {
  // Remove old markers
  await page.evaluate(() => {
    document.querySelectorAll('.doc-step-marker').forEach(e => e.remove())
    document.querySelectorAll('[data-doc-highlight]').forEach(e => {
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

      await page.evaluate(({ top, left, step, label }) => {
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
            ${label ? `<div style="
              background: #0f172a;
              color: #f8fafc;
              font-size: 11px;
              font-weight: 700;
              padding: 3px 7px;
              border-radius: 5px;
              border: 1px solid rgba(255,255,255,0.25);
              white-space: nowrap;
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            ">${label}</div>` : ''}
          </div>
        `
        document.body.appendChild(wrapper)
      }, { top, left, step, label })
    } catch (e) {
      console.warn(`Could not annotate target [${step}]: ${selector}`, e.message)
    }
  }
}

async function run() {
  console.log('🚀 Starting screenshot capture for Admin and Staff User Manuals...')
  const browser = await chromium.launch({ headless: true })

  // ----------------------------------------------------
  // SECTION A: PUBLIC / ONBOARDING / SIGNUP
  // ----------------------------------------------------
  console.log('\n--- Capturing Public & Onboarding Screens ---')
  const publicPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  
  // Login Screen
  await publicPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await annotate(publicPage, [
    { selector: 'input[type="email"]', step: 1, label: 'Work Email' },
    { selector: 'input[type="password"]', step: 2, label: 'Password' },
    { selector: 'button[type="submit"]', step: 3, label: 'Sign In' },
  ])
  await publicPage.screenshot({ path: path.join(ADMIN_DIR, '01_login.png') })
  await publicPage.screenshot({ path: path.join(STAFF_DIR, '01_login.png') })
  console.log('✓ Captured 01_login.png')

  // Signup Screen
  await publicPage.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' })
  await annotate(publicPage, [
    { selector: 'input[name="fullName"], input[placeholder*="name" i]', step: 1, label: 'Full Name' },
    { selector: 'input[name="email"], input[type="email"]', step: 2, label: 'Email' },
    { selector: 'input[name="password"], input[type="password"]', step: 3, label: 'Create Password' },
    { selector: 'button:has-text("passcode"), button:has-text("code")', step: 4, label: 'Enter Invite Code' },
  ])
  await publicPage.screenshot({ path: path.join(STAFF_DIR, '02_signup_onboarding.png') })
  console.log('✓ Captured 02_signup_onboarding.png')

  await publicPage.close()

  // ----------------------------------------------------
  // SECTION B: ADMIN SESSION
  // ----------------------------------------------------
  console.log('\n--- Capturing Admin Screens ---')
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const adminPage = await adminContext.newPage()

  // Login as Admin
  await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await adminPage.locator('input[type="email"]').fill('admin@thoorigai.test')
  await adminPage.locator('input[type="password"]').fill('ThoorigaiLocal123!')
  await adminPage.locator('button[type="submit"]').click()
  await adminPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await adminPage.waitForTimeout(2000)

  // 1. Admin Dashboard Overview
  await adminPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'a[href="/students"]:has-text("Add"), a.btn-primary:has-text("student")', step: 1, label: 'Add Student' },
    { selector: '.stats-grid', step: 2, label: 'Executive Financial Metrics' },
    { selector: 'a[href="/invoices"]', step: 3, label: 'Invoices Navigation' },
    { selector: 'aside.sidebar', step: 4, label: 'Admin Command Bar' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '02_executive_dashboard.png') })
  console.log('✓ Captured 02_executive_dashboard.png')

  // 2. Users and Roles
  await adminPage.goto(`${BASE_URL}/settings/users`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'button:has-text("Generate"), button:has-text("Invite")', step: 1, label: 'Generate Invite Code' },
    { selector: 'table, .user-list', step: 2, label: 'Active Users Roster' },
    { selector: 'text=Approve as Admin', step: 3, label: 'Approve Admin' },
    { selector: 'text=Approve as Staff', step: 4, label: 'Approve Staff' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '03_users_and_roles.png') })
  console.log('✓ Captured 03_users_and_roles.png')

  // Click Generate Invite Code Modal
  const genBtn = adminPage.locator('button:has-text("Generate Invite Code"), button:has-text("New Code")').first()
  if (await genBtn.isVisible()) {
    await genBtn.click()
    await adminPage.waitForTimeout(500)
    try {
      await adminPage.locator('h3:has-text("Generate Invite Code")').waitFor({ timeout: 4000 })
      await annotate(adminPage, [
        { selector: 'button:has-text("Staff Access")', step: 1, label: 'Staff Role Card' },
        { selector: 'button:has-text("Admin Access")', step: 2, label: 'Admin Role Card (Purple)' },
        { selector: 'select#invite-expiry-select', step: 3, label: 'Expiration Window' },
        { selector: 'input[placeholder*="rajesh@"]', step: 4, label: 'Email Restriction' },
        { selector: 'button[type="submit"]:has-text("Generate")', step: 5, label: 'Generate Code' },
      ])
      await adminPage.screenshot({ path: path.join(ADMIN_DIR, '04_invite_modal.png') })
      console.log('✓ Captured 04_invite_modal.png')
    } catch (e) {
      console.warn('Could not open invite modal:', e.message)
    }
    // Close modal
    const closeBtn = adminPage.locator('button:has-text("Cancel")').first()
    if (await closeBtn.isVisible()) await closeBtn.click()
  }

  // 3. Students Directory
  await adminPage.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'input[placeholder*="Search" i]', step: 1, label: 'Search Students' },
    { selector: 'a[href*="/students/new"], a:has-text("Add student"), button:has-text("Add student")', step: 2, label: 'New Student' },
    { selector: 'table', step: 3, label: 'Enrolled Students' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '05_students_directory.png') })
  console.log('✓ Captured 05_students_directory.png')

  // 4. Invoices & Billing
  await adminPage.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'button:has-text("Record"), a:has-text("Record"), button:has-text("Payment")', step: 1, label: 'Record Fee Payment' },
    { selector: 'table', step: 2, label: 'GST Invoice Ledger' },
    { selector: 'button:has-text("Download"), button[aria-label*="download" i]', step: 3, label: 'PDF Invoice' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '06_invoices_ledger.png') })
  console.log('✓ Captured 06_invoices_ledger.png')

  // 5. Courses Management
  await adminPage.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'button:has-text("Create"), button:has-text("Add"), a:has-text("New Course")', step: 1, label: 'Add New Course' },
    { selector: '.courses-grid, table, .grid', step: 2, label: 'Course Catalog & Pricing' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '07_courses_management.png') })
  console.log('✓ Captured 07_courses_management.png')

  // 6. Course Materials
  await adminPage.goto(`${BASE_URL}/materials`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'select, [role="combobox"]', step: 1, label: 'Filter Course Module' },
    { selector: 'button:has-text("Upload"), input[type="file"]', step: 2, label: 'Upload Materials' },
    { selector: 'table, .materials-list', step: 3, label: 'Curriculum Assets List' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '08_course_materials.png') })
  console.log('✓ Captured 08_course_materials.png')

  // 7. Attendance
  await adminPage.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'select, input[type="date"]', step: 1, label: 'Course & Date Selector' },
    { selector: 'button:has-text("Present"), button:has-text("All Present")', step: 2, label: 'Mark All Present' },
    { selector: 'table, .attendance-grid', step: 3, label: 'Roll-Call Roster' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '09_attendance_tracker.png') })
  console.log('✓ Captured 09_attendance_tracker.png')

  // 8. Assessments & Grading Studio
  await adminPage.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'button:has-text("Create"), button:has-text("New Assessment")', step: 1, label: 'Create Assessment' },
    { selector: 'button:has-text("Google Forms"), button:has-text("Import")', step: 2, label: 'Import Google Forms/Sheets' },
    { selector: 'button:has-text("Grade"), a:has-text("Grade")', step: 3, label: 'Open Grading Studio' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '10_assessments_studio.png') })
  console.log('✓ Captured 10_assessments_studio.png')

  // 9. Certificates
  await adminPage.goto(`${BASE_URL}/certificates`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'button:has-text("Issue"), button:has-text("Generate")', step: 1, label: 'Issue Certificate' },
    { selector: 'table, .cert-list', step: 2, label: 'Issued Certificates Registry' },
    { selector: 'button:has-text("Download"), a:has-text("Download")', step: 3, label: 'Official PDF with QR' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '11_certificates_issuance.png') })
  console.log('✓ Captured 11_certificates_issuance.png')

  // 10. Reports
  await adminPage.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'button:has-text("Financial"), [role="tab"]:has-text("Financial")', step: 1, label: 'Financial Revenue Reports' },
    { selector: 'button:has-text("Academic"), [role="tab"]:has-text("Academic")', step: 2, label: 'Academic Performance' },
    { selector: 'button:has-text("Export"), button:has-text("CSV")', step: 3, label: 'Export Data (CSV)' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '12_reports_analytics.png') })
  console.log('✓ Captured 12_reports_analytics.png')

  // 11. Audit Log
  await adminPage.goto(`${BASE_URL}/audit-log`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'input[placeholder*="Search" i], select', step: 1, label: 'Filter Action / User' },
    { selector: 'table, .audit-table', step: 2, label: 'Immutable Audit Trail' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '13_audit_log.png') })
  console.log('✓ Captured 13_audit_log.png')

  // 12. Settings - GST
  await adminPage.goto(`${BASE_URL}/settings/gst`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'input[name*="gstin" i], input', step: 1, label: 'GSTIN Registration No' },
    { selector: 'button:has-text("Save")', step: 2, label: 'Save Tax Configuration' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '14_gst_settings.png') })
  console.log('✓ Captured 14_gst_settings.png')

  // 13. Settings - Brand
  await adminPage.goto(`${BASE_URL}/settings/brand`, { waitUntil: 'networkidle' })
  await adminPage.waitForTimeout(1500)
  await annotate(adminPage, [
    { selector: 'input[name*="name" i], input', step: 1, label: 'Academy Legal & Display Name' },
    { selector: 'button:has-text("Save")', step: 2, label: 'Update Brand Assets' },
  ])
  await adminPage.screenshot({ path: path.join(ADMIN_DIR, '15_brand_settings.png') })
  console.log('✓ Captured 15_brand_settings.png')

  await adminContext.close()

  // ----------------------------------------------------
  // SECTION C: STAFF SESSION
  // ----------------------------------------------------
  console.log('\n--- Capturing Staff Screens ---')
  const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const staffPage = await staffContext.newPage()

  // Login as Staff
  await staffPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await staffPage.locator('input[type="email"]').fill('staff@thoorigai.test')
  await staffPage.locator('input[type="password"]').fill('ThoorigaiLocal123!')
  await staffPage.locator('button[type="submit"]').click()
  await staffPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await staffPage.waitForTimeout(2000)

  // 1. Staff Classroom Dashboard
  await staffPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: '.stats-grid', step: 1, label: 'Classroom Operations Summary' },
    { selector: 'aside.sidebar', step: 2, label: 'Staff Permitted Navigation' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '03_staff_dashboard.png') })
  console.log('✓ Captured 03_staff_dashboard.png')

  // 2. Staff Students Directory
  await staffPage.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: 'input[placeholder*="Search" i]', step: 1, label: 'Search Batch Students' },
    { selector: 'table', step: 2, label: 'Enrolled Student Cohort' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '04_staff_students.png') })
  console.log('✓ Captured 04_staff_students.png')

  // 3. Staff Attendance Roll-Call
  await staffPage.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: 'select, input[type="date"]', step: 1, label: 'Select Batch & Date' },
    { selector: 'button:has-text("Present"), button:has-text("All Present")', step: 2, label: 'One-Click Mark All Present' },
    { selector: 'table', step: 3, label: 'Student Roll-Call Grid' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '05_staff_attendance.png') })
  console.log('✓ Captured 05_staff_attendance.png')

  // 4. Staff Assessments
  await staffPage.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: 'button:has-text("Create"), button:has-text("New Assessment")', step: 1, label: 'New Classroom Test' },
    { selector: 'button:has-text("Google Forms"), button:has-text("Import")', step: 2, label: 'Import Google Form Responses' },
    { selector: 'button:has-text("Grade"), a:has-text("Grade")', step: 3, label: 'Enter Grading Studio' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '06_staff_assessments.png') })
  console.log('✓ Captured 06_staff_assessments.png')

  // 5. Staff Materials Upload
  await staffPage.goto(`${BASE_URL}/materials`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: 'select', step: 1, label: 'Select Target Course Module' },
    { selector: 'button:has-text("Upload"), input[type="file"]', step: 2, label: 'Upload Lesson Assets' },
    { selector: 'table', step: 3, label: 'Downloadable Class Files' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '07_staff_materials.png') })
  console.log('✓ Captured 07_staff_materials.png')

  // 6. Staff Academic Reports
  await staffPage.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: '.stats-grid, table, .reports-container', step: 1, label: 'Class Pass Rate & Performance' },
    { selector: 'button:has-text("Export"), button:has-text("CSV")', step: 2, label: 'Download Roster Scores' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '08_staff_academic_reports.png') })
  console.log('✓ Captured 08_staff_academic_reports.png')

  // 7. Staff User Settings
  await staffPage.goto(`${BASE_URL}/settings/user`, { waitUntil: 'networkidle' })
  await staffPage.waitForTimeout(1500)
  await annotate(staffPage, [
    { selector: 'input[name*="name" i], input[type="text"]', step: 1, label: 'Display Profile' },
    { selector: 'input[type="password"]', step: 2, label: 'Change Password' },
    { selector: 'button:has-text("Save"), button:has-text("Update")', step: 3, label: 'Save Credentials' },
  ])
  await staffPage.screenshot({ path: path.join(STAFF_DIR, '09_staff_settings.png') })
  console.log('✓ Captured 09_staff_settings.png')

  await staffContext.close()
  await browser.close()
  console.log('\n🎉 All screenshots successfully captured and annotated!')
}

run().catch(err => {
  console.error('Fatal error during screenshot capture:', err)
  process.exit(1)
})
