import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:3005'
const MANUALS_DIR = path.resolve('docs/manuals')
const ADMIN_IMG_DIR = path.resolve('docs/manuals/screenshots/admin')
const STAFF_IMG_DIR = path.resolve('docs/manuals/screenshots/staff')

fs.mkdirSync(MANUALS_DIR, { recursive: true })

function getBase64Img(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('Image not found:', filePath)
    return ''
  }
  const ext = path.extname(filePath).slice(1)
  const b64 = fs.readFileSync(filePath).toString('base64')
  return `data:image/${ext};base64,${b64}`
}

async function captureModal() {
  console.log('Capturing invite modal screenshot...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.locator('input[type="email"]').fill('admin@thoorigai.test')
    await page.locator('input[type="password"]').fill('ThoorigaiLocal123!')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    
    await page.goto(`${BASE_URL}/settings/users`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    const genBtn = page.locator('button:has-text("Generate Invite Code"), button:has-text("New Code")').first()
    if (await genBtn.isVisible()) {
      await genBtn.click()
      await page.locator('h3:has-text("Generate Invite Code")').waitFor({ timeout: 5000 })
      await page.waitForTimeout(600)

      // Annotate inside modal
      const targets = [
        { selector: 'button:has-text("Staff Access")', step: 1, label: 'Staff Access (STAFF-XXXX)' },
        { selector: 'button:has-text("Admin Access")', step: 2, label: 'Admin Access (ADMIN-XXXX)' },
        { selector: 'select#invite-expiry-select', step: 3, label: 'Expiration Window' },
        { selector: 'input[placeholder*="rajesh@"]', step: 4, label: 'Email Restriction (Optional)' },
        { selector: 'button[type="submit"]:has-text("Generate")', step: 5, label: 'Generate & Copy Code' },
      ]

      for (const { selector, step, label } of targets) {
        try {
          const loc = page.locator(selector).first()
          if (await loc.isVisible()) {
            const box = await loc.boundingBox()
            if (box) {
              await loc.evaluate((el) => {
                el.style.outline = '3px solid #e11d48'
                el.style.outlineOffset = '2px'
              })
              await page.evaluate(({ top, left, step, label }) => {
                const wrapper = document.createElement('div')
                wrapper.className = 'doc-step-marker'
                wrapper.innerHTML = `
                  <div style="
                    position: absolute;
                    top: ${top - 12 + window.scrollY}px;
                    left: ${left - 12 + window.scrollX}px;
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
                    <div style="
                      background: #0f172a;
                      color: #f8fafc;
                      font-size: 11px;
                      font-weight: 700;
                      padding: 3px 7px;
                      border-radius: 5px;
                      border: 1px solid rgba(255,255,255,0.25);
                      white-space: nowrap;
                      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                    ">${label}</div>
                  </div>
                `
                document.body.appendChild(wrapper)
              }, { top: box.y, left: box.x, step, label })
            }
          }
        } catch (e) {}
      }

      await page.screenshot({ path: path.join(ADMIN_IMG_DIR, '04_invite_modal.png') })
      console.log('✓ Successfully recaptured 04_invite_modal.png with open modal!')
    }
  } catch (err) {
    console.warn('Could not recapture modal:', err.message)
  } finally {
    await browser.close()
  }
}

// Global stylesheet for publication-grade PDF
const sharedCss = `
  @page {
    size: A4 portrait;
    margin: 14mm 14mm 16mm 14mm;
    @bottom-right {
      content: counter(page);
    }
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.55;
    font-size: 13px;
    margin: 0;
    padding: 0;
  }
  .page-break {
    page-break-before: always;
  }
  .avoid-break {
    page-break-inside: avoid;
  }
  
  /* Cover Page */
  .cover {
    min-height: 92vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%);
  }
  .cover-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo-badge {
    background: #1e3a8a;
    color: #ffffff;
    padding: 10px 18px;
    font-weight: 900;
    font-size: 20px;
    letter-spacing: 2px;
    border-radius: 8px;
  }
  .cover-title-group {
    margin-top: 60px;
  }
  .cover-tag {
    display: inline-block;
    padding: 4px 12px;
    background: #dbeafe;
    color: #1d4ed8;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 6px;
    margin-bottom: 16px;
  }
  .cover h1 {
    font-size: 34px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 0 0 16px 0;
  }
  .cover-subtitle {
    font-size: 16px;
    color: #475569;
    max-width: 600px;
    line-height: 1.5;
  }
  .cover-meta {
    margin-top: 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    background: #ffffff;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
  }
  .meta-item strong {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 4px;
  }
  .meta-item span {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
  .cover-footer {
    border-top: 1px solid #cbd5e1;
    padding-top: 16px;
    font-size: 11px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }

  /* Headings & Sections */
  h2.section-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin: 32px 0 8px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-num {
    background: #2563eb;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
  }
  h3.flow-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin: 20px 0 8px 0;
  }
  p.desc {
    color: #475569;
    margin-top: 0;
    margin-bottom: 14px;
    font-size: 13px;
  }
  .route-pill {
    display: inline-block;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-family: monospace;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  /* Screenshot Figure */
  .screenshot-box {
    margin: 16px 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .screenshot-box img {
    width: 100%;
    height: auto;
    display: block;
  }
  .screenshot-caption {
    font-size: 11px;
    font-weight: 600;
    color: #475569;
    padding: 8px 14px;
    background: #f1f5f9;
    border-top: 1px solid #e2e8f0;
  }

  /* Numbered Steps Table */
  table.steps-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 12px;
  }
  table.steps-table th {
    background: #f1f5f9;
    color: #334155;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    font-weight: 700;
  }
  table.steps-table td {
    padding: 9px 12px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  table.steps-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  .badge-callout {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: #e11d48;
    color: #ffffff;
    border-radius: 50%;
    font-weight: 800;
    font-size: 12px;
    margin-right: 6px;
    box-shadow: 0 2px 4px rgba(225,29,72,0.3);
  }
  .btn-name {
    font-weight: 700;
    color: #0f172a;
  }

  /* Callout Boxes */
  .callout-box {
    padding: 12px 16px;
    border-radius: 8px;
    margin: 14px 0;
    font-size: 12px;
  }
  .callout-tip {
    background: #f0fdf4;
    border-left: 4px solid #16a34a;
    color: #166534;
  }
  .callout-warning {
    background: #fefce8;
    border-left: 4px solid #ca8a04;
    color: #854d0e;
  }
  .callout-important {
    background: #eff6ff;
    border-left: 4px solid #2563eb;
    color: #1e40af;
  }
  .callout-title {
    font-weight: 700;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Sitemap Cards */
  .sitemap-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 18px 0;
  }
  .sitemap-node {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px;
    background: #f8fafc;
  }
  .sitemap-node-header {
    font-weight: 700;
    font-size: 13px;
    color: #1e3a8a;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
  }
  .sitemap-node-path {
    font-family: monospace;
    font-size: 11px;
    color: #64748b;
  }
  .sitemap-node ul {
    margin: 8px 0 0 16px;
    padding: 0;
    font-size: 11.5px;
    color: #334155;
  }
`

async function buildAdminManual() {
  console.log('Generating HTML for Admin Manual...')
  
  const imgLogin = getBase64Img(path.join(ADMIN_IMG_DIR, '01_login.png'))
  const imgDash = getBase64Img(path.join(ADMIN_IMG_DIR, '02_executive_dashboard.png'))
  const imgUsers = getBase64Img(path.join(ADMIN_IMG_DIR, '03_users_and_roles.png'))
  const imgModal = getBase64Img(path.join(ADMIN_IMG_DIR, '04_invite_modal.png'))
  const imgStudents = getBase64Img(path.join(ADMIN_IMG_DIR, '05_students_directory.png'))
  const imgInvoices = getBase64Img(path.join(ADMIN_IMG_DIR, '06_invoices_ledger.png'))
  const imgCourses = getBase64Img(path.join(ADMIN_IMG_DIR, '07_courses_management.png'))
  const imgMaterials = getBase64Img(path.join(ADMIN_IMG_DIR, '08_course_materials.png'))
  const imgAttendance = getBase64Img(path.join(ADMIN_IMG_DIR, '09_attendance_tracker.png'))
  const imgAssessments = getBase64Img(path.join(ADMIN_IMG_DIR, '10_assessments_studio.png'))
  const imgCerts = getBase64Img(path.join(ADMIN_IMG_DIR, '11_certificates_issuance.png'))
  const imgReports = getBase64Img(path.join(ADMIN_IMG_DIR, '12_reports_analytics.png'))
  const imgAudit = getBase64Img(path.join(ADMIN_IMG_DIR, '13_audit_log.png'))
  const imgGst = getBase64Img(path.join(ADMIN_IMG_DIR, '14_gst_settings.png'))
  const imgBrand = getBase64Img(path.join(ADMIN_IMG_DIR, '15_brand_settings.png'))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ThoorigAI Infotech - Administrator Operations Manual</title>
  <style>${sharedCss}</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div>
      <div class="cover-header">
        <div class="logo-badge">THOORIGAI</div>
        <div>
          <strong style="display:block; font-size: 15px; color: #0f172a;">THOORIGAI INFOTECH LLP</strong>
          <span style="font-size: 12px; color: #64748b;">Enterprise Academy Administration & Operations</span>
        </div>
      </div>

      <div class="cover-title-group">
        <span class="cover-tag">Executive Systems Guide</span>
        <h1>ADMINISTRATOR OPERATIONS MANUAL</h1>
        <p class="cover-subtitle">
          Complete, end-to-end visual operating handbook for Executive Administrators. Details every system workflow, button action, financial ledger procedure, OTP invitation management, student enrollment, and compliance audit trail.
        </p>
      </div>

      <div class="cover-meta">
        <div class="meta-item">
          <strong>Document Classification</strong>
          <span>Internal Operations / Executive</span>
        </div>
        <div class="meta-item">
          <strong>Software Version</strong>
          <span>Thoorigai Core v1.0.0 (Next.js 16)</span>
        </div>
        <div class="meta-item">
          <strong>Authorized Roles</strong>
          <span>Executive Administrator (role='admin')</span>
        </div>
        <div class="meta-item">
          <strong>Effective Date</strong>
          <span>October 2026 (Live Release)</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>ThoorigAI Infotech LLP &bull; Confidential & Proprietary</span>
      <span>Document Ref: THOOR-ADM-MAN-2026-v1</span>
    </div>
  </div>

  <!-- TABLE OF CONTENTS & SITEMAP -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">00</span> Complete Administrator Sitemap & Route Hierarchy</h2>
  <p class="desc">
    Administrators possess complete read, write, update, and deletion permissions across all financial, user access, and academic tables. The table below illustrates the administrative sitemap.
  </p>

  <div class="sitemap-grid">
    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Executive Command</span>
        <span class="route-pill">/</span>
      </div>
      <div class="sitemap-node-path">Overview dashboard & KPI analytics</div>
      <ul>
        <li>Gross & Net tuition collections</li>
        <li>GST liabilities & pending dues</li>
        <li>Active student & batch count</li>
        <li>Direct enrollment shortcuts</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Student Directory</span>
        <span class="route-pill">/students</span>
      </div>
      <div class="sitemap-node-path">Learner lifecycle management</div>
      <ul>
        <li>Add student & enrollment registration</li>
        <li>Fee concession & installment allocation</li>
        <li>Batch transfer & status modification</li>
        <li>Direct invoice & attendance linkages</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Invoices & Billing</span>
        <span class="route-pill">/invoices</span>
      </div>
      <div class="sitemap-node-path">Tax compliant billing ledger</div>
      <ul>
        <li>Paid, partial & overdue ledgers</li>
        <li>Offline fee payment recording (UPI/Cash)</li>
        <li>Digital GST invoice PDF generation</li>
        <li>Automated tax calculation (9% CGST+SGST)</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Curriculum & Courses</span>
        <span class="route-pill">/courses</span>
      </div>
      <div class="sitemap-node-path">Course catalog configuration</div>
      <ul>
        <li>Create course & set pricing tiers</li>
        <li>Assign primary instructor trainers</li>
        <li>Configure duration & competencies</li>
        <li>Course Category & Skill tag mapping</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Attendance Roster</span>
        <span class="route-pill">/attendance</span>
      </div>
      <div class="sitemap-node-path">Cohort attendance tracking</div>
      <ul>
        <li>Daily roll-call by course & batch</li>
        <li>Mark Present, Absent, Late, Excused</li>
        <li>One-click "Mark All Present"</li>
        <li>Real-time automated saving</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Assessments Studio</span>
        <span class="route-pill">/assessments</span>
      </div>
      <div class="sitemap-node-path">Academic grading & evaluation</div>
      <ul>
        <li>Create tests, assignments & quizzes</li>
        <li>Import Google Forms & Sheets scores</li>
        <li>Student Grading Studio & feedback</li>
        <li>Individual submission re-grade / delete</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Certificates & Verification</span>
        <span class="route-pill">/certificates</span>
      </div>
      <div class="sitemap-node-path">Credentials & public QR verification</div>
      <ul>
        <li>Eligibility check (Fees cleared + passed)</li>
        <li>Issue verified certificate with unique code</li>
        <li>Printable high-res PDF certificate</li>
        <li>Public /verify verification portal</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Access & Role Security</span>
        <span class="route-pill">/settings/users</span>
      </div>
      <div class="sitemap-node-path">OTP generator & identity approval</div>
      <ul>
        <li>Approve pending signups as Admin/Staff</li>
        <li>Generate single-use OTP codes (7-day expiry)</li>
        <li>Copy registration links for candidates</li>
        <li>Revoke or upgrade permissions</li>
      </ul>
    </div>
  </div>

  <!-- MODULE 1: AUTHENTICATION -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">01</span> System Authentication & Login Flow</h2>
  <span class="route-pill">Route: /login</span>
  <p class="desc">
    All administrative actions require authenticated session access. Administrator accounts are linked to verified profiles with executive permissions.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgLogin}" alt="Administrator Login Screen" />
    <div class="screenshot-caption">Figure 1.1: System Sign-In Portal with highlighted credential inputs and action button.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Element / Action</th>
        <th style="width: 32%;">User Input / Description</th>
        <th style="width: 30%;">System Behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Work Email Input</span></td>
        <td>Enter your registered administrator email address (e.g. <code>admin@thoorigai.test</code>).</td>
        <td>Validates RFC 5322 email syntax in real-time.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Password Input</span></td>
        <td>Enter your confidential master password. Masked for security.</td>
        <td>Ensures password length &amp; complexity standards.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Sign In Button</span></td>
        <td>Click to transmit credentials over secure TLS endpoint.</td>
        <td>Authenticates with Supabase Auth, resolves executive profile, sets HTTP-only session cookie, and routes to Executive Dashboard.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box callout-important avoid-break">
    <div class="callout-title">Security Recommendation</div>
    Session cookies are partitioned with <code>SameSite=Lax</code> and <code>HttpOnly</code> headers. If session expiration occurs after 24 hours of inactivity, the user is redirected to <code>/login</code> automatically without data loss.
  </div>

  <!-- MODULE 2: EXECUTIVE DASHBOARD -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">02</span> Executive Dashboard & Financial Command</h2>
  <span class="route-pill">Route: /</span>
  <p class="desc">
    The central intelligence cockpit provides a real-time summary of revenue, collection efficiency, tuition receivables, pending approvals, and active academic cohorts.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgDash}" alt="Executive Dashboard" />
    <div class="screenshot-caption">Figure 2.1: Executive Dashboard with financial KPI cards, quick actions, and sidebar navigation.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Element / Action</th>
        <th style="width: 32%;">Description &amp; Purpose</th>
        <th style="width: 30%;">Resulting Workflow</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Add Student Quick Action</span></td>
        <td>Top-right primary CTA button located on the executive header.</td>
        <td>Instantly triggers learner enrollment modal without needing to switch tabs.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Executive Financial Metrics</span></td>
        <td>8 live calculation cards: Revenue collected, Total fees, Balance, Collection efficiency, Active students, Eligible certificates, Pending dues, Average fee.</td>
        <td>Aggregates payments, discounts, and receivables in real-time directly from Postgres database.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Invoices Navigation</span></td>
        <td>Direct link in the dark command sidebar to the billing ledger.</td>
        <td>Navigates to <code>/invoices</code> for tax invoice generation and offline receipt recordings.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Admin Command Sidebar</span></td>
        <td>Persistent left-side navigation displaying all 10 core administrative modules.</td>
        <td>Provides instant 1-click access to all system modules, categorized by operations and settings.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 3: USERS & ROLES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">03</span> User Management, Approvals & OTP Generation</h2>
  <span class="route-pill">Route: /settings/users</span>
  <p class="desc">
    Security controls for onboarding staff and co-administrators. The system features an automated, single-use One-Time Passcode (OTP) invitation protocol with automatic expiration.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgUsers}" alt="Users and Roles Screen" />
    <div class="screenshot-caption">Figure 3.1: Users and Roles directory displaying Active Users, Pending Approvals, and OTP generation tools.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Element / Action</th>
        <th style="width: 32%;">Description &amp; Parameters</th>
        <th style="width: 30%;">System Consequence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Generate Invite Code</span></td>
        <td>Top-right button triggering the invite generation modal.</td>
        <td>Opens the OTP configuration dialog to create single-use invitation tokens.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Active Users Roster</span></td>
        <td>Table displaying all registered users, roles (Admin/Staff), email, and creation date.</td>
        <td>Click any user row to edit personal contact info, departmental metadata, or revoke access.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Approve as Admin</span></td>
        <td>Dedicated action button on pending user signups.</td>
        <td>Elevates pending user to full Administrator, updates JWT metadata, and grants complete permissions.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Approve as Staff</span></td>
        <td>Alternative approval button for instructional staff.</td>
        <td>Activates user with Staff permissions, restricting access to classroom and academic tools.</td>
      </tr>
    </tbody>
  </table>

  <!-- INVITE MODAL DETAILS -->
  <h3 class="flow-title avoid-break">Creating Single-Use OTP Invite Links</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgModal}" alt="Generate Invite Modal" />
    <div class="screenshot-caption">Figure 3.2: Modal interface for creating scoped, time-bound Staff vs Admin invitation codes.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Option / Control</th>
        <th style="width: 32%;">Instructions</th>
        <th style="width: 30%;">Security Effect</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Staff Access Card</span></td>
        <td>Click to select standard instructional privileges.</td>
        <td>Generates prefix <code>STAFF-XXXX</code>. Restricted from financial data and settings.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Admin Access Card</span></td>
        <td>Click to select executive administrator privileges. Highlighted in royal purple.</td>
        <td>Generates prefix <code>ADMIN-XXXX</code>. Grants full system access upon redemption.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Expiration Window</span></td>
        <td>Select duration: 1 Hour, 24 Hours (Standard), 3 Days, or 7 Days.</td>
        <td>After this timestamp, the code automatically burns and cannot be redeemed.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Email Restriction (Optional)</span></td>
        <td>Enter candidate's email address if you wish to restrict redemption to one person.</td>
        <td>Only an account matching this exact email will be allowed to use this code.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">5</span></td>
        <td><span class="btn-name">Generate Code Button</span></td>
        <td>Click to write the cryptographic invite token to the database.</td>
        <td>Produces single-use link: <code>https://app/signup?code=...</code> ready to copy.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 4: STUDENTS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">04</span> Student Lifecycle & Enrollment Management</h2>
  <span class="route-pill">Route: /students</span>
  <p class="desc">
    Complete master registry of all enrolled learners, course batches, tuition payment balances, and academic progress indicators.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgStudents}" alt="Students Directory" />
    <div class="screenshot-caption">Figure 4.1: Student Directory with search filtering, enrollment status badges, and action triggers.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Control</th>
        <th style="width: 32%;">Action</th>
        <th style="width: 30%;">Output</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Search Students</span></td>
        <td>Type student name, register number (e.g. <code>STU-2026-001</code>), email, or mobile.</td>
        <td>Instant client-side filter updating the roster view without page reloads.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">New Student Button</span></td>
        <td>Click to open learner registration form.</td>
        <td>Captures name, contact info, course selection, agreed fee, and initial installment.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Enrolled Students Table</span></td>
        <td>View student ID, name, course, batch start, total fee, balance, and status.</td>
        <td>Click any student row to view full billing history, attendance log, or issue certificate.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 5: INVOICES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">05</span> Invoicing, Payment Recording & GST Compliance</h2>
  <span class="route-pill">Route: /invoices</span>
  <p class="desc">
    Official billing records, installment schedules, offline payment collection, and digital tax invoice issuance conforming to Indian GST regulations (CGST 9% + SGST 9% or IGST 18%).
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgInvoices}" alt="Invoices Ledger" />
    <div class="screenshot-caption">Figure 5.1: Billing Ledger displaying invoice status (Paid, Partial, Overdue) and action buttons.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Action</th>
        <th style="width: 32%;">Data Entry Requirements</th>
        <th style="width: 30%;">Financial Record Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Record Fee Payment</span></td>
        <td>Click the primary "Record Payment" button to log an incoming payment.</td>
        <td>Opens modal: select Student, enter Amount, Payment Date, Mode (UPI/Cash/Bank), and Reference #.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">GST Invoice Ledger</span></td>
        <td>Displays Invoice #, Student Name, Total Bill, Paid Amount, Balance, and Status.</td>
        <td>Automatically recalculates balance and updates student financial status upon payment entry.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">PDF Invoice Download</span></td>
        <td>Click the download icon next to any invoice row.</td>
        <td>Generates official PDF tax invoice with ThoorigAI GSTIN, legal address, tax breakdown, and QR code.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 6: COURSES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">06</span> Course Curriculum & Program Catalog</h2>
  <span class="route-pill">Route: /courses</span>
  <p class="desc">
    Configure training programs, syllabus structure, pricing tiers (Essential, Elite, Internship), course durations, and assign certified trainers.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgCourses}" alt="Courses Management" />
    <div class="screenshot-caption">Figure 6.1: Course catalog view with course category badges, fees, and creation triggers.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Element</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 30%;">Action / Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Add New Course Button</span></td>
        <td>Top CTA to create a new program in the academy catalog.</td>
        <td>Prompts for Course Title, Short Code (e.g. <code>FS-MERN</code>), Category, Fee, and Duration.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Course Catalog & Pricing</span></td>
        <td>Grid listing all courses with student enrollment counts and fees.</td>
        <td>Allows editing syllabus outlines, modifying standard tuition, or archiving discontinued courses.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 7: MATERIALS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">07</span> Course Materials & Learning Repository</h2>
  <span class="route-pill">Route: /materials</span>
  <p class="desc">
    Digital asset management backed by secure cloud storage. Upload presentation slides, code repositories, assignments, and reference documents.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgMaterials}" alt="Course Materials" />
    <div class="screenshot-caption">Figure 7.1: Course Materials interface with module selection and secure upload dropzone.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Control</th>
        <th style="width: 32%;">How to Use</th>
        <th style="width: 30%;">Storage Behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Filter Course Module</span></td>
        <td>Select the specific course from the dropdown selector.</td>
        <td>Loads existing learning assets categorized by topic and week.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Upload Materials</span></td>
        <td>Click or drag &amp; drop files (PDF, PPTX, ZIP, MP4) up to 50MB.</td>
        <td>Uploads to private Supabase Storage bucket with authenticated presigned download URLs.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Curriculum Assets List</span></td>
        <td>Table of uploaded files with upload date, file size, and uploader name.</td>
        <td>Direct download link or delete action for outdated lesson files.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 8: ATTENDANCE -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">08</span> Daily Attendance Tracking & Roll-Call</h2>
  <span class="route-pill">Route: /attendance</span>
  <p class="desc">
    Batch-wise daily attendance marking with automated saving. Tracks attendance percentages required for certificate issuance eligibility.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgAttendance}" alt="Attendance Tracker" />
    <div class="screenshot-caption">Figure 8.1: Attendance Roll-Call screen with date picker, quick-mark actions, and student grid.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Element</th>
        <th style="width: 32%;">Action</th>
        <th style="width: 30%;">Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Course & Date Selector</span></td>
        <td>Choose the target course batch and select the attendance date from calendar.</td>
        <td>Renders student roll-call list for the selected cohort and session.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Mark All Present</span></td>
        <td>Single-click shortcut button at top of attendance roster.</td>
        <td>Instantly marks every student in the cohort as "Present" with a single action.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Roll-Call Roster</span></td>
        <td>Interactive row per student: click [Present], [Absent], [Late], or [Excused].</td>
        <td>Changes trigger debounced autosave to database; status indicator confirms save.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 9: ASSESSMENTS & GRADING -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">09</span> Assessments Studio & Google Forms Sync</h2>
  <span class="route-pill">Route: /assessments</span>
  <p class="desc">
    Create academic tests, link Google Forms / Sheets for automated grading, enter qualitative trainer feedback, and maintain evaluation standards.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgAssessments}" alt="Assessments Studio" />
    <div class="screenshot-caption">Figure 9.1: Assessments Studio with Google Forms sync modal, grading studio triggers, and tests roster.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Action</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 30%;">Resulting Workflow</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Create Assessment</span></td>
        <td>Define test title, target course, max score, passing threshold, and evaluation date.</td>
        <td>Publishes assessment to course syllabus and initiates student submission tracking.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Import Google Forms/Sheets</span></td>
        <td>Paste external Google Form URL and Google Sheets responses link.</td>
        <td>Preserves live links for trainers and imports student score columns automatically.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Open Grading Studio</span></td>
        <td>Click "Grade" next to any test to open the interactive evaluation table.</td>
        <td>Review student submissions, input marks, type qualitative feedback, and save evaluations.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 10: CERTIFICATES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">10</span> Certificate Issuance & QR Verification</h2>
  <span class="route-pill">Route: /certificates</span>
  <p class="desc">
    Issue officially authenticated course completion certificates. Each certificate embeds a tamper-proof verification hash and QR code verifiable on <code>/verify</code>.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgCerts}" alt="Certificates Issuance" />
    <div class="screenshot-caption">Figure 10.1: Certificate registry displaying issued credentials, verification codes, and PDF generation.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Control</th>
        <th style="width: 32%;">Eligibility &amp; Operation</th>
        <th style="width: 30%;">Output</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Issue Certificate</span></td>
        <td>System checks prerequisites: (1) 100% fees cleared, (2) Pass marks in assessments.</td>
        <td>Generates unique verification code (e.g. <code>VREF-CERT-1048-A9B8</code>) with timestamp.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Certificates Registry</span></td>
        <td>Displays student name, course, issue date, unique verification ID, and status.</td>
        <td>Maintains an immutable record of all certified graduates.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Official PDF with QR</span></td>
        <td>Click "Download" to generate vector-grade certificate PDF.</td>
        <td>Renders high-resolution certificate with ThoorigAI seal, signature, and scan-to-verify QR code.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 11: REPORTS & AUDIT LOG -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">11</span> Reports, Analytics & Immutable Audit Trail</h2>
  <span class="route-pill">Routes: /reports &amp; /audit-log</span>
  <p class="desc">
    Export financial and academic analytics, and inspect the chronological database audit trail with correlation IDs.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgReports}" alt="Reports and Analytics" />
    <div class="screenshot-caption">Figure 11.1: Financial and Academic analytics tabs with CSV export options.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Section</th>
        <th style="width: 32%;">Information Provided</th>
        <th style="width: 30%;">Export Options</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Financial Revenue Reports</span></td>
        <td>Monthly collection run-rates, course revenue breakdown, and GST tax collected.</td>
        <td>Download accounting spreadsheet with full transaction details.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Academic Performance</span></td>
        <td>Pass/fail ratios, batch average scores, and attendance percentage distribution.</td>
        <td>Review cohort health and flag learners needing intervention.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Export Data (CSV)</span></td>
        <td>One-click CSV generator at the top right of the reports dashboard.</td>
        <td>Exports structured data ready for import into Excel, Tally, or external ERP systems.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="flow-title avoid-break">System Forensics & Audit Trail</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgAudit}" alt="Audit Log Trail" />
    <div class="screenshot-caption">Figure 11.2: Immutable Audit Log recording every administrative and security action.</div>
  </div>

  <!-- MODULE 12: SETTINGS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">12</span> System Settings & Academy Configuration</h2>
  <span class="route-pill">Routes: /settings/gst &amp; /settings/brand</span>
  <p class="desc">
    Maintain business tax compliance numbers and visual academy brand parameters.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgGst}" alt="GST Settings" />
    <div class="screenshot-caption">Figure 12.1: Tax compliance settings configuring GSTIN, legal name, and tax percentages.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Setting Field</th>
        <th style="width: 32%;">Configuration Purpose</th>
        <th style="width: 30%;">Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">GSTIN Registration No</span></td>
        <td>Enter the 15-character Goods and Services Tax Identification Number.</td>
        <td>Printed on all official fee receipts and digital tax invoices.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Save Tax Configuration</span></td>
        <td>Click to persist tax configuration changes to the database.</td>
        <td>Instantly updates tax engine for all subsequent invoice calculations.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-box avoid-break">
    <img src="${imgBrand}" alt="Brand Information" />
    <div class="screenshot-caption">Figure 12.2: Academy identity parameters: legal business name, brand logo, and contact info.</div>
  </div>

</body>
</html>`

  const htmlPath = path.join(MANUALS_DIR, 'Thoorigai_Admin_User_Manual.html')
  fs.writeFileSync(htmlPath, html, 'utf8')
  console.log('✓ Wrote Thoorigai_Admin_User_Manual.html')
  return htmlPath
}

async function buildStaffManual() {
  console.log('Generating HTML for Staff Manual...')

  const imgLogin = getBase64Img(path.join(STAFF_IMG_DIR, '01_login.png'))
  const imgSignup = getBase64Img(path.join(STAFF_IMG_DIR, '02_signup_onboarding.png'))
  const imgDash = getBase64Img(path.join(STAFF_IMG_DIR, '03_staff_dashboard.png'))
  const imgStudents = getBase64Img(path.join(STAFF_IMG_DIR, '04_staff_students.png'))
  const imgAttendance = getBase64Img(path.join(STAFF_IMG_DIR, '05_staff_attendance.png'))
  const imgAssessments = getBase64Img(path.join(STAFF_IMG_DIR, '06_staff_assessments.png'))
  const imgMaterials = getBase64Img(path.join(STAFF_IMG_DIR, '07_staff_materials.png'))
  const imgReports = getBase64Img(path.join(STAFF_IMG_DIR, '08_staff_academic_reports.png'))
  const imgSettings = getBase64Img(path.join(STAFF_IMG_DIR, '09_staff_settings.png'))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ThoorigAI Infotech - Staff & Instructor User Manual</title>
  <style>${sharedCss}</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div>
      <div class="cover-header">
        <div class="logo-badge">THOORIGAI</div>
        <div>
          <strong style="display:block; font-size: 15px; color: #0f172a;">THOORIGAI INFOTECH LLP</strong>
          <span style="font-size: 12px; color: #64748b;">Instructional Operations & Classroom Management</span>
        </div>
      </div>

      <div class="cover-title-group">
        <span class="cover-tag" style="background: #dcfce7; color: #15803d;">Staff &amp; Faculty Guide</span>
        <h1>STAFF &amp; INSTRUCTOR USER MANUAL</h1>
        <p class="cover-subtitle">
          Complete visual operational manual for Instructors and Academic Staff. Explains the invitation onboarding process, classroom operations, batch roll-call attendance, Google Forms assessment workflows, grading studio, and curriculum asset management.
        </p>
      </div>

      <div class="cover-meta">
        <div class="meta-item">
          <strong>Audience</strong>
          <span>Instructional Staff, Faculty &amp; Trainers</span>
        </div>
        <div class="meta-item">
          <strong>Authorized Role</strong>
          <span>Academy Staff (role='staff')</span>
        </div>
        <div class="meta-item">
          <strong>Version</strong>
          <span>Release 1.0 (Live Production)</span>
        </div>
        <div class="meta-item">
          <strong>Effective Date</strong>
          <span>October 2026</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>ThoorigAI Infotech LLP &bull; Faculty Resource</span>
      <span>Document Ref: THOOR-STF-MAN-2026-v1</span>
    </div>
  </div>

  <!-- SITEMAP & PERMISSIONS MATRIX -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">00</span> Staff Navigation Scope & Permissions Matrix</h2>
  <p class="desc">
    As instructional faculty, your dashboard is tailored specifically for classroom delivery, student progress tracking, and evaluations. Sensitive administrative functions (GST tax settings, tuition revenue, user role changes) are restricted to administrators.
  </p>

  <div class="sitemap-grid">
    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Classroom Dashboard</span>
        <span class="route-pill">/</span>
      </div>
      <div class="sitemap-node-path">Classroom operations hub</div>
      <ul>
        <li>Active enrolled students</li>
        <li>Ongoing batches &amp; courses</li>
        <li>Pending grading assignments</li>
        <li>Quick roll-call triggers</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Student Rosters</span>
        <span class="route-pill">/students</span>
      </div>
      <div class="sitemap-node-path">Cohort communication &amp; info</div>
      <ul>
        <li>Filter by assigned course</li>
        <li>Learner contact email &amp; phone</li>
        <li>Check batch enrollment dates</li>
        <li>View individual attendance rate</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Attendance Tracker</span>
        <span class="route-pill">/attendance</span>
      </div>
      <div class="sitemap-node-path">Daily roll-call registry</div>
      <ul>
        <li>Batch &amp; date roll-call roster</li>
        <li>Mark Present, Absent, Late, Excused</li>
        <li>Keyboard navigation shortcuts</li>
        <li>Real-time automated saving</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Assessments Studio</span>
        <span class="route-pill">/assessments</span>
      </div>
      <div class="sitemap-node-path">Grading &amp; evaluations</div>
      <ul>
        <li>Create assignments, quizzes &amp; tests</li>
        <li>Link Google Forms &amp; Sheets scores</li>
        <li>Grading studio &amp; feedback remarks</li>
        <li>Publish scores to learner records</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Course Materials</span>
        <span class="route-pill">/materials</span>
      </div>
      <div class="sitemap-node-path">Learning asset repository</div>
      <ul>
        <li>Upload lecture slides &amp; PDFs</li>
        <li>Share code examples &amp; lab guides</li>
        <li>Categorize by course topic</li>
        <li>Download reference curriculum files</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>Academic Reports</span>
        <span class="route-pill">/reports</span>
      </div>
      <div class="sitemap-node-path">Classroom performance analytics</div>
      <ul>
        <li>Batch pass / fail percentages</li>
        <li>Student test score distributions</li>
        <li>Attendance compliance analytics</li>
        <li>Export class grades to CSV</li>
      </ul>
    </div>
  </div>

  <!-- MODULE 1: ONBOARDING & SIGNUP -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">01</span> Staff Onboarding & Account Registration</h2>
  <span class="route-pill">Route: /signup?code=STAFF-XXXX</span>
  <p class="desc">
    Instructors receive a secure, one-time invitation link or passcode from the Academy Administrator. Registering with an active code automatically validates your account as verified Staff.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgSignup}" alt="Staff Registration Screen" />
    <div class="screenshot-caption">Figure 1.1: Registration portal highlighting required instructor fields and invitation passcode entry.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Field / Button</th>
        <th style="width: 32%;">Instructions</th>
        <th style="width: 30%;">Validation Rule</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Full Name Input</span></td>
        <td>Enter your legal name as it should appear on student evaluation reports.</td>
        <td>Minimum 2 characters; displayed on classroom notices.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Email Address Input</span></td>
        <td>Enter your institutional or work email address.</td>
        <td>Must match recipient restriction if configured by admin.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Create Password</span></td>
        <td>Create a strong personal password.</td>
        <td>Minimum 8 characters with numbers and special symbols.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Enter Invite Code</span></td>
        <td>Enter the <code>STAFF-XXXX</code> code provided by your administrator (pre-filled if using invite link).</td>
        <td>Single-use code burned upon registration; elevates account instantly to Staff.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 2: STAFF DASHBOARD -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">02</span> Instructor Classroom Dashboard</h2>
  <span class="route-pill">Route: /</span>
  <p class="desc">
    Your operational dashboard shows current batch progress, scheduled sessions, total students enrolled across your courses, and pending test grading tasks.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgDash}" alt="Staff Classroom Dashboard" />
    <div class="screenshot-caption">Figure 2.1: Staff dashboard focused on classroom operations, active cohorts, and grading tasks.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Widget / Element</th>
        <th style="width: 32%;">Information Provided</th>
        <th style="width: 30%;">Recommended Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Classroom Operations Summary</span></td>
        <td>Active Students enrolled in your courses, Ongoing Batches, and Pending Submissions awaiting evaluation.</td>
        <td>Click cards to jump directly to attendance or grading tables.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Staff Navigation Sidebar</span></td>
        <td>Streamlined sidebar displaying instructional tools: Students, Attendance, Assessments, Materials, Reports.</td>
        <td>Use to transition between modules during lecture sessions.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 3: STUDENT DIRECTORY -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">03</span> Student Directory & Batch Communication</h2>
  <span class="route-pill">Route: /students</span>
  <p class="desc">
    Access learner rosters for your assigned courses to coordinate batch communications, view student contact numbers, and monitor individual attendance rates.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgStudents}" alt="Staff Students View" />
    <div class="screenshot-caption">Figure 3.1: Student Directory with search bar and batch cohort rosters.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Action</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 30%;">Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Search Batch Students</span></td>
        <td>Filter learners by typing their first or last name, register ID, or email.</td>
        <td>Instant live search filter across all active cohort rosters.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Enrolled Student Cohort</span></td>
        <td>Displays Register Number, Full Name, Course Name, Batch Start Date, and Status.</td>
        <td>Click a student to view their attendance record and assessment scores.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 4: ATTENDANCE -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">04</span> Daily Attendance Roll-Call Workflow</h2>
  <span class="route-pill">Route: /attendance</span>
  <p class="desc">
    Mark daily attendance with instant automated saving. Efficient one-click tools and keyboard navigation allow rapid roll-call during lecture commencement.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgAttendance}" alt="Staff Attendance Marking" />
    <div class="screenshot-caption">Figure 4.1: Daily roll-call interface with one-click bulk marking and status toggles.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Control</th>
        <th style="width: 32%;">Action</th>
        <th style="width: 30%;">System Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Select Batch &amp; Date</span></td>
        <td>Select the course batch from dropdown and confirm the session date.</td>
        <td>Loads the official class roster for that specific date.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">One-Click Mark All Present</span></td>
        <td>Click the green "Mark All Present" button at the top of the roster.</td>
        <td>Sets every student's status to "Present" in a single action.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Student Roll-Call Grid</span></td>
        <td>Toggle individual exceptions: click [Absent] or [Late] for students not on time.</td>
        <td>Changes trigger debounced autosave; green badge indicates data is persisted.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 5: ASSESSMENTS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">05</span> Assessments, Google Forms & Grading Studio</h2>
  <span class="route-pill">Route: /assessments</span>
  <p class="desc">
    Create test milestones, sync external Google Forms and Google Sheets scores, evaluate student code submissions, and write qualitative performance feedback.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgAssessments}" alt="Staff Assessments Studio" />
    <div class="screenshot-caption">Figure 5.1: Assessments Studio showing new test creation, Google Form syncing, and grading buttons.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Action</th>
        <th style="width: 32%;">Step Description</th>
        <th style="width: 30%;">Output</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">New Classroom Test</span></td>
        <td>Click "Create Assessment". Enter title (e.g. <code>React State Quiz</code>), max marks, and passing threshold.</td>
        <td>Adds assessment entry to course syllabus.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Import Google Form Responses</span></td>
        <td>Click "Import" to link a Google Form or Google Sheet URL.</td>
        <td>Imports student score columns directly into the grading ledger.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Enter Grading Studio</span></td>
        <td>Click "Grade" next to the test to evaluate individual student answers.</td>
        <td>Enter score out of max marks, type instructor feedback remarks, and save grades.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 6: COURSE MATERIALS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">06</span> Course Materials & Learning Asset Uploads</h2>
  <span class="route-pill">Route: /materials</span>
  <p class="desc">
    Distribute lesson presentations, lab exercises, sample project repositories, and reference cheat-sheets to your students.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgMaterials}" alt="Staff Materials Upload" />
    <div class="screenshot-caption">Figure 6.1: Course materials repository with upload dropzone and module selector.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Action</th>
        <th style="width: 32%;">Instructions</th>
        <th style="width: 30%;">Storage Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Select Target Course Module</span></td>
        <td>Choose which course topic or week the file belongs to.</td>
        <td>Filters existing assets and associates new uploads with the selected module.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Upload Lesson Assets</span></td>
        <td>Drag &amp; drop PDF slides, ZIP archives, or code files up to 50MB.</td>
        <td>Uploads to encrypted storage bucket and notifies enrolled students.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Downloadable Class Files</span></td>
        <td>View uploaded files with upload date and file size.</td>
        <td>Click download icon to review files on classroom display systems.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 7: ACADEMIC REPORTS & SETTINGS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">07</span> Academic Reports & Personal Settings</h2>
  <span class="route-pill">Routes: /reports &amp; /settings/user</span>
  <p class="desc">
    Review batch-wise test score distributions and manage your instructor profile and account password.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgReports}" alt="Staff Academic Reports" />
    <div class="screenshot-caption">Figure 7.1: Academic performance metrics showing cohort pass percentages and assessment averages.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 10%;">Step</th>
        <th style="width: 28%;">Action</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 30%;">Benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Class Pass Rate & Performance</span></td>
        <td>View overall pass percentage, average test scores, and completion trends.</td>
        <td>Identify struggling learners early to provide remedial academic support.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Download Roster Scores</span></td>
        <td>Click "Export CSV" to download class marks in spreadsheet format.</td>
        <td>Enables offline record keeping and semester grading archives.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="flow-title avoid-break">Instructor Profile & Credentials</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgSettings}" alt="Staff User Settings" />
    <div class="screenshot-caption">Figure 7.2: Personal account settings for updating instructor display name and password.</div>
  </div>

</body>
</html>`

  const htmlPath = path.join(MANUALS_DIR, 'Thoorigai_Staff_User_Manual.html')
  fs.writeFileSync(htmlPath, html, 'utf8')
  console.log('✓ Wrote Thoorigai_Staff_User_Manual.html')
  return htmlPath
}

async function convertHtmlToPdf(htmlPath, pdfPath, documentTitle) {
  console.log(`Rendering PDF: ${pdfPath}...`)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size: 8px; color: #94a3b8; width: 100%; text-align: right; padding-right: 14mm; font-family: sans-serif;">${documentTitle} &bull; ThoorigAI Infotech LLP</div>`,
    footerTemplate: `<div style="font-size: 8px; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm; font-family: sans-serif;"><span>Confidential & Proprietary</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm',
    },
  })

  await browser.close()
  const stats = fs.statSync(pdfPath)
  console.log(`✓ PDF Generated successfully: ${pdfPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
}

async function main() {
  await captureModal()
  const adminHtml = await buildAdminManual()
  const staffHtml = await buildStaffManual()

  const adminPdf = path.join(MANUALS_DIR, 'Thoorigai_Admin_User_Manual.pdf')
  const staffPdf = path.join(MANUALS_DIR, 'Thoorigai_Staff_User_Manual.pdf')

  await convertHtmlToPdf(adminHtml, adminPdf, 'ADMINISTRATOR OPERATIONS MANUAL')
  await convertHtmlToPdf(staffHtml, staffPdf, 'STAFF & INSTRUCTOR USER MANUAL')

  console.log('\n🎉 Both PDF Manuals successfully generated!')
  console.log('1. Admin Manual:', adminPdf)
  console.log('2. Staff Manual:', staffPdf)
}

main().catch(err => {
  console.error('Fatal error building manuals:', err)
  process.exit(1)
})
