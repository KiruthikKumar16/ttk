import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

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

const sharedCss = `
  @page {
    size: A4 portrait;
    margin: 12mm 12mm 14mm 12mm;
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
    line-height: 1.5;
    font-size: 12px;
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
    min-height: 94vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 30px;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
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
    font-size: 22px;
    letter-spacing: 2px;
    border-radius: 8px;
  }
  .cover-title-group {
    margin-top: 50px;
  }
  .cover-tag {
    display: inline-block;
    padding: 4px 12px;
    background: #dbeafe;
    color: #1d4ed8;
    font-weight: 800;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 6px;
    margin-bottom: 14px;
  }
  .cover h1 {
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 0 0 16px 0;
  }
  .cover-subtitle {
    font-size: 15px;
    color: #475569;
    max-width: 620px;
    line-height: 1.5;
  }
  .cover-meta {
    margin-top: 36px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    background: #ffffff;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
  }
  .meta-item strong {
    display: block;
    font-size: 10.5px;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 3px;
  }
  .meta-item span {
    font-size: 13.5px;
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

  /* Headings & Section Styling */
  h2.section-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    margin: 28px 0 8px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-num {
    background: #2563eb;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 5px;
  }
  h3.flow-title {
    font-size: 14.5px;
    font-weight: 700;
    color: #1e293b;
    margin: 18px 0 6px 0;
  }
  p.desc {
    color: #475569;
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 12px;
  }
  .route-pill {
    display: inline-block;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-family: monospace;
    font-size: 10.5px;
    padding: 2px 7px;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  /* Screenshot Figure */
  .screenshot-box {
    margin: 14px 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
    box-shadow: 0 3px 10px rgba(0,0,0,0.06);
  }
  .screenshot-box img {
    width: 100%;
    height: auto;
    display: block;
  }
  .screenshot-caption {
    font-size: 10.5px;
    font-weight: 600;
    color: #475569;
    padding: 7px 12px;
    background: #f1f5f9;
    border-top: 1px solid #e2e8f0;
  }

  /* Numbered Steps Table */
  table.steps-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 11.5px;
  }
  table.steps-table th {
    background: #f1f5f9;
    color: #334155;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    font-weight: 700;
  }
  table.steps-table td {
    padding: 8px 10px;
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
    width: 20px;
    height: 20px;
    background: #e11d48;
    color: #ffffff;
    border-radius: 50%;
    font-weight: 800;
    font-size: 11px;
    margin-right: 5px;
    box-shadow: 0 2px 4px rgba(225,29,72,0.3);
  }
  .btn-name {
    font-weight: 700;
    color: #0f172a;
  }

  /* Callout Boxes */
  .callout-box {
    padding: 10px 14px;
    border-radius: 6px;
    margin: 12px 0;
    font-size: 11.5px;
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
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* Sitemap Cards */
  .sitemap-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 14px 0;
  }
  .sitemap-node {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    background: #f8fafc;
  }
  .sitemap-node-header {
    font-weight: 700;
    font-size: 12px;
    color: #1e3a8a;
    margin-bottom: 3px;
    display: flex;
    justify-content: space-between;
  }
  .sitemap-node-path {
    font-family: monospace;
    font-size: 10px;
    color: #64748b;
  }
  .sitemap-node ul {
    margin: 6px 0 0 14px;
    padding: 0;
    font-size: 10.5px;
    color: #334155;
  }
`

async function buildAdminManual() {
  console.log('Assembling Full Comprehensive Admin Manual...')
  
  const imgLogin = getBase64Img(path.join(ADMIN_IMG_DIR, '01_login.png'))
  const imgDash = getBase64Img(path.join(ADMIN_IMG_DIR, '02_executive_dashboard.png'))
  const imgDashAcad = getBase64Img(path.join(ADMIN_IMG_DIR, '03_dashboard_academic_tab.png'))
  const imgTopbar = getBase64Img(path.join(ADMIN_IMG_DIR, '29_topbar_notifications.png'))
  const imgUsers = getBase64Img(path.join(ADMIN_IMG_DIR, '04_users_and_roles.png'))
  const imgModal = getBase64Img(path.join(ADMIN_IMG_DIR, '05_invite_modal.png'))
  const imgUserEdit = getBase64Img(path.join(ADMIN_IMG_DIR, '06_user_edit_modal.png'))
  const imgStudents = getBase64Img(path.join(ADMIN_IMG_DIR, '07_students_directory.png'))
  const imgAddStudent = getBase64Img(path.join(ADMIN_IMG_DIR, '08_add_student_modal.png'))
  const imgInvoices = getBase64Img(path.join(ADMIN_IMG_DIR, '09_invoices_ledger.png'))
  const imgRecordPay = getBase64Img(path.join(ADMIN_IMG_DIR, '10_record_payment_modal.png'))
  const imgCourses = getBase64Img(path.join(ADMIN_IMG_DIR, '11_courses_catalog.png'))
  const imgMaterials = getBase64Img(path.join(ADMIN_IMG_DIR, '13_course_materials.png'))
  const imgAttendance = getBase64Img(path.join(ADMIN_IMG_DIR, '14_attendance_tracker.png'))
  const imgAssessments = getBase64Img(path.join(ADMIN_IMG_DIR, '15_assessments_studio.png'))
  const imgCerts = getBase64Img(path.join(ADMIN_IMG_DIR, '18_certificates_issuance.png'))
  const imgVerify = getBase64Img(path.join(ADMIN_IMG_DIR, '19_verify_public_portal.png'))
  const imgReportsFin = getBase64Img(path.join(ADMIN_IMG_DIR, '20_reports_financial.png'))
  const imgReportsAcad = getBase64Img(path.join(ADMIN_IMG_DIR, '21_reports_academic.png'))
  const imgAudit = getBase64Img(path.join(ADMIN_IMG_DIR, '22_audit_log.png'))
  const imgGst = getBase64Img(path.join(ADMIN_IMG_DIR, '23_gst_settings.png'))
  const imgBrand = getBase64Img(path.join(ADMIN_IMG_DIR, '24_brand_settings.png'))
  const imgTrainers = getBase64Img(path.join(ADMIN_IMG_DIR, '25_instructor_assignments.png'))
  const imgCats = getBase64Img(path.join(ADMIN_IMG_DIR, '26_course_categories.png'))
  const imgSkills = getBase64Img(path.join(ADMIN_IMG_DIR, '27_skill_tags.png'))
  const imgSettings = getBase64Img(path.join(ADMIN_IMG_DIR, '28_user_settings.png'))

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
          <strong style="display:block; font-size: 16px; color: #0f172a;">THOORIGAI INFOTECH LLP</strong>
          <span style="font-size: 12px; color: #64748b;">Enterprise Academy Administration & Operating System</span>
        </div>
      </div>

      <div class="cover-title-group">
        <span class="cover-tag">Executive Operations Handbook</span>
        <h1>ADMINISTRATOR COMPLETE OPERATIONS MANUAL</h1>
        <p class="cover-subtitle">
          An exhaustive, screen-by-screen, button-by-button manual covering 100% of academy features: onboarding, role security, student admissions, fee invoicing, attendance tracking, assessment grading, certification, financial reporting, and compliance audit trail.
        </p>
      </div>

      <div class="cover-meta">
        <div class="meta-item">
          <strong>Document Scope</strong>
          <span>Complete A-to-Z Feature Reference</span>
        </div>
        <div class="meta-item">
          <strong>Software Version</strong>
          <span>Thoorigai Core Production v1.0.0</span>
        </div>
        <div class="meta-item">
          <strong>Authorized Roles</strong>
          <span>Executive Administrator (role='admin')</span>
        </div>
        <div class="meta-item">
          <strong>Verification Standard</strong>
          <span>E2E Playwright Audited & Verified</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>ThoorigAI Infotech LLP &bull; Confidential & Proprietary</span>
      <span>Document Ref: THOOR-ADM-EXP-2026-v2</span>
    </div>
  </div>

  <!-- SITEMAP & ARCHITECTURE -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">00</span> Complete Administrator Sitemap & Route Directory</h2>
  <p class="desc">
    Below is the complete architectural layout of every accessible administrative view, URL, and operational capability in the system.
  </p>

  <div class="sitemap-grid">
    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>1. Executive Dashboard</span>
        <span class="route-pill">/</span>
      </div>
      <div class="sitemap-node-path">Central command & financial overview</div>
      <ul>
        <li>8 Real-time KPI Metric cards</li>
        <li>Financial Overview vs Academic View toggle</li>
        <li>Course mix table & active batch counter</li>
        <li>Add Student executive quick-action</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>2. Students Directory</span>
        <span class="route-pill">/students</span>
      </div>
      <div class="sitemap-node-path">Comprehensive learner registry</div>
      <ul>
        <li>Filter tabs: All, Active, Completed, Paused</li>
        <li>Add student multi-step modal</li>
        <li>Tuition fee concession calculator</li>
        <li>Installment schedule & balance tracking</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>3. Invoices & Billing</span>
        <span class="route-pill">/invoices</span>
      </div>
      <div class="sitemap-node-path">Tax-compliant billing ledger</div>
      <ul>
        <li>Paid, Partially Paid & Overdue filters</li>
        <li>Record offline payment modal (UPI/Cash/NEFT)</li>
        <li>Download official GST PDF invoices</li>
        <li>Automated CGST/SGST/IGST calculation</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>4. Courses & Curriculum</span>
        <span class="route-pill">/courses</span>
      </div>
      <div class="sitemap-node-path">Program catalog & pricing tiers</div>
      <ul>
        <li>Create course & set duration/tuition</li>
        <li>Tiers: Essential, Elite, Internship</li>
        <li>Assign primary certified trainers</li>
        <li>Map competencies & skill tags</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>5. Course Materials</span>
        <span class="route-pill">/materials</span>
      </div>
      <div class="sitemap-node-path">Encrypted digital file repository</div>
      <ul>
        <li>Filter assets by course module</li>
        <li>Upload lecture slides & code files (up to 50MB)</li>
        <li>Downloadable curriculum documents</li>
        <li>Secure presigned cloud storage bucket</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>6. Attendance Roster</span>
        <span class="route-pill">/attendance</span>
      </div>
      <div class="sitemap-node-path">Daily cohort roll-call management</div>
      <ul>
        <li>Batch & date picker controls</li>
        <li>One-click "Mark All Present" shortcut</li>
        <li>Status toggles: Present, Absent, Late, Excused</li>
        <li>Debounced automated database saving</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>7. Assessments Studio</span>
        <span class="route-pill">/assessments</span>
      </div>
      <div class="sitemap-node-path">Academic grading & Google Forms sync</div>
      <ul>
        <li>Create tests, assignments & capstones</li>
        <li>Sync Google Forms & Sheets response URLs</li>
        <li>Grading Studio: marks & qualitative remarks</li>
        <li>Single-result deletion & re-evaluation</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>8. Certificates Registry</span>
        <span class="route-pill">/certificates</span>
      </div>
      <div class="sitemap-node-path">Official credentialing & verification</div>
      <ul>
        <li>Automated eligibility checks (fees + marks)</li>
        <li>Generate tamper-proof verification ID</li>
        <li>Download printable high-res PDF certificate</li>
        <li>Public /verify portal with scan-to-verify QR</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>9. Reports & Analytics</span>
        <span class="route-pill">/reports</span>
      </div>
      <div class="sitemap-node-path">Financial & academic business intelligence</div>
      <ul>
        <li>Monthly revenue collection run-rate</li>
        <li>Course profitability & GST summary</li>
        <li>Academic pass rates & attendance stats</li>
        <li>One-click CSV exports for accounting</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>10. Audit Log Forensics</span>
        <span class="route-pill">/audit-log</span>
      </div>
      <div class="sitemap-node-path">Immutable chronological database trail</div>
      <ul>
        <li>Real-time database trigger logging</li>
        <li>Actor, action, entity & timestamp tracking</li>
        <li>Trace actions by Correlation ID</li>
        <li>Inspect raw JSON modification payload</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>11. Access & Role Security</span>
        <span class="route-pill">/settings/users</span>
      </div>
      <div class="sitemap-node-path">User accounts & OTP invite protocol</div>
      <ul>
        <li>Approve pending signups as Admin or Staff</li>
        <li>Generate single-use OTP codes (1h-7d expiry)</li>
        <li>Edit user metadata & phone contacts</li>
        <li>Danger Zone: Revoke access or remove user</li>
      </ul>
    </div>

    <div class="sitemap-node">
      <div class="sitemap-node-header">
        <span>12. System Configuration</span>
        <span class="route-pill">/settings/*</span>
      </div>
      <div class="sitemap-node-path">Tax, brand & academic taxonomies</div>
      <ul>
        <li>GST Settings (/settings/gst)</li>
        <li>Brand Information (/settings/brand)</li>
        <li>Trainer Assignments (/settings/trainers)</li>
        <li>Course Categories & Skill Tags</li>
      </ul>
    </div>
  </div>

  <!-- SECTION 1: AUTHENTICATION -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">01</span> System Authentication & Login Flow</h2>
  <span class="route-pill">Route: /login</span>
  <p class="desc">
    Administrators access the enterprise portal through email and password authentication. The server sets an encrypted, HttpOnly session cookie and verifies executive role permissions.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgLogin}" alt="Administrator Sign-In Portal" />
    <div class="screenshot-caption">Figure 1.1: Sign-In portal with email, password fields, and submit action.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control / Action</th>
        <th style="width: 32%;">Input / Details</th>
        <th style="width: 35%;">System Outcome</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Work Email Input</span></td>
        <td>Enter registered admin email (e.g. <code>admin@thoorigai.test</code>).</td>
        <td>Validates RFC 5322 syntax; flags malformed inputs.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Password Input</span></td>
        <td>Enter confidential administrator password.</td>
        <td>Masked entry with support for secure password managers.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Sign In Button</span></td>
        <td>Click to submit credentials to <code>/api/auth/login</code>.</td>
        <td>Authenticates against Supabase Auth, updates JWT app_metadata with profile role, and redirects to Dashboard.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2: TOPBAR & NOTIFICATIONS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">02</span> Global Header, Quick Search & Notifications</h2>
  <span class="route-pill">Global Topbar Component</span>
  <p class="desc">
    Present across every administrative page, the topbar provides instant global student search, unread system alerts, user settings access, and session termination.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgTopbar}" alt="Topbar and Notifications" />
    <div class="screenshot-caption">Figure 2.1: Global Topbar displaying instant search bar, notification dropdown, and account actions.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Interaction</th>
        <th style="width: 35%;">Action Performed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Global Instant Search</span></td>
        <td>Click search bar or press keyboard shortcut <code>Ctrl+K</code> / <code>Cmd+K</code>.</td>
        <td>Instant typeahead queries students by name, register ID, phone, or invoices without page reload.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Notifications Center</span></td>
        <td>Click the bell icon to toggle the notification drawer.</td>
        <td>Displays system alerts (pending approvals, new registrations, payment receipts) with "Mark All Read".</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Account Settings</span></td>
        <td>Click the profile avatar or settings icon.</td>
        <td>Navigates directly to <code>/settings/user</code> to update credentials or personal contact details.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Secure Sign Out</span></td>
        <td>Click "Sign out" button on top-right.</td>
        <td>Calls <code>/api/auth/logout</code>, purges session cookies, and safely redirects to <code>/login</code>.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: EXECUTIVE DASHBOARD -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">03</span> Executive Dashboard & KPI Intelligence</h2>
  <span class="route-pill">Route: /</span>
  <p class="desc">
    The Executive Dashboard aggregates high-level institutional metrics: revenue collections, pending student balances, collection efficiency, active enrollments, and academic progress.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgDash}" alt="Executive Dashboard" />
    <div class="screenshot-caption">Figure 3.1: Executive Dashboard with live KPI cards, tab toggles, and enrollment quick-action.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Element</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Workflow Triggered</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Add Student CTA</span></td>
        <td>Top-right primary button on executive header.</td>
        <td>Triggers enrollment modal instantly from any view without switching pages.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Financial KPI Cards</span></td>
        <td>Live cards: Revenue Collected, Enrolled Cohort Value, Pending Balance, Collection Efficiency (%).</td>
        <td>Aggregates payment ledgers directly from Postgres database in real time.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Academic Tab Toggle</span></td>
        <td>Click "Staff & Academic Data" toggle button.</td>
        <td>Switches dashboard view to classroom operational metrics (active cohorts, attendance rates).</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Master Navigation Sidebar</span></td>
        <td>Persistent left command bar.</td>
        <td>Provides one-click navigation to all 10 core administrative sections and settings modules.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="flow-title avoid-break">Staff & Academic Data View</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgDashAcad}" alt="Academic Dashboard Tab" />
    <div class="screenshot-caption">Figure 3.2: Academic view displaying cohort attendance, upcoming sessions, and pending test grading.</div>
  </div>

  <!-- SECTION 4: USERS & ROLES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">04</span> User Management & Security Access Control</h2>
  <span class="route-pill">Route: /settings/users</span>
  <p class="desc">
    Full identity and access management: reviewing pending signups, generating time-bound OTP invite codes, editing staff metadata, or revoking access.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgUsers}" alt="Users and Roles Roster" />
    <div class="screenshot-caption">Figure 4.1: Users directory displaying active accounts, pending registrations, and role approval actions.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Action</th>
        <th style="width: 32%;">Target</th>
        <th style="width: 35%;">Security Outcome</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Generate Invite Code</span></td>
        <td>Top CTA button above user directory.</td>
        <td>Opens the OTP configuration dialog to create single-use registration tokens.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">User Directory Roster</span></td>
        <td>Interactive table of registered staff and admins.</td>
        <td>Click "Settings & Info" on any row to edit contact details, phone, or departmental info.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Approve as Admin</span></td>
        <td>Approval button next to pending user registration.</td>
        <td>Elevates user to full Administrator; updates JWT metadata and grants unrestricted access.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Approve as Staff</span></td>
        <td>Approval button next to pending user registration.</td>
        <td>Activates user as Staff; restricts access to classroom, attendance, and assessment tools.</td>
      </tr>
    </tbody>
  </table>

  <!-- INVITE MODAL -->
  <h3 class="flow-title avoid-break">Generating Single-Use OTP Passcodes</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgModal}" alt="Generate Invite Modal" />
    <div class="screenshot-caption">Figure 4.2: Scoped invitation modal with color-coded Staff vs Admin selection and expiration windows.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Instructions</th>
        <th style="width: 35%;">Behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Staff Access Card</span></td>
        <td>Select for instructional staff &amp; trainers.</td>
        <td>Generates <code>STAFF-XXXX</code> code. Confers standard classroom permissions.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Admin Access Card</span></td>
        <td>Select for executive administrators (royal purple theme).</td>
        <td>Generates <code>ADMIN-XXXX</code> code. Grants complete executive permissions.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Expiration Window</span></td>
        <td>Choose validity: 1 Hour (Express), 24 Hours, 3 Days, or 7 Days.</td>
        <td>Tokens automatically expire and burn after this timestamp.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Email Restriction</span></td>
        <td>Optional: enter candidate's exact work email.</td>
        <td>Enforces that only this exact email address can redeem the generated invite code.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">5</span></td>
        <td><span class="btn-name">Generate Code CTA</span></td>
        <td>Click to generate cryptographic token.</td>
        <td>Copies single-use link: <code>https://app/signup?code=...</code> to clipboard.</td>
      </tr>
    </tbody>
  </table>

  <!-- USER EDIT & DANGER ZONE -->
  <div class="page-break"></div>
  <h3 class="flow-title avoid-break">User Details & Danger Zone Actions</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgUserEdit}" alt="User Edit Modal" />
    <div class="screenshot-caption">Figure 4.3: User metadata editor and Account Danger Zone (Revoke Access / Remove User).</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Element</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Action Performed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Phone Numbers</span></td>
        <td>Primary mobile, alternate phone, and emergency contact.</td>
        <td>Updates trainer contact card used in classroom coordination.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">View User Log</span></td>
        <td>Button deep-linking to <code>/audit-log</code>.</td>
        <td>Filters the entire database audit trail to show all actions performed by this user.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Revoke Access</span></td>
        <td>Click "Revoke Access (Set Pending)".</td>
        <td>Immediately demotes user to <code>pending</code>, invalidating active sessions.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Remove User</span></td>
        <td>Destructive action button.</td>
        <td>Prompts confirmation dialog; permanently purges profile and auth credentials.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">5</span></td>
        <td><span class="btn-name">Save Changes</span></td>
        <td>Click "Save User Details".</td>
        <td>Persists profile updates to database with immediate UI confirmation.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 5: STUDENTS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">05</span> Student Lifecycle & Enrollment Management</h2>
  <span class="route-pill">Route: /students</span>
  <p class="desc">
    Master learner registry managing enrollment, tuition fee installments, course batch assignments, and academic status.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgStudents}" alt="Students Directory" />
    <div class="screenshot-caption">Figure 5.1: Student Directory with search bar, course filters, and enrollment triggers.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Input / Details</th>
        <th style="width: 35%;">Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Search Filter</span></td>
        <td>Search by Student Name, Register Number (e.g. <code>STU-2026-001</code>), or Phone.</td>
        <td>Instant client-side filter displaying matching learners in real time.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Add Student Button</span></td>
        <td>Click primary action button.</td>
        <td>Opens the multi-step learner enrollment and billing form.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Master Registry Table</span></td>
        <td>Displays Register ID, Name, Course, Batch Date, Total Fees, Balance, and Status.</td>
        <td>Click any student row to view payment history, attendance records, or issue certificates.</td>
      </tr>
    </tbody>
  </table>

  <!-- ADD STUDENT MODAL -->
  <h3 class="flow-title avoid-break">Adding a New Student & Billing Setup</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgAddStudent}" alt="Add Student Modal" />
    <div class="screenshot-caption">Figure 5.2: Student admission form with demographic inputs, course selection, and initial installment.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Form Section</th>
        <th style="width: 32%;">Fields &amp; Validations</th>
        <th style="width: 35%;">System Consequence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Student Legal Name</span></td>
        <td>Full name as it should appear on official completion certificates.</td>
        <td>Validated against minimum 2 characters; creates unique registration profile.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Course Selection</span></td>
        <td>Choose target program from course catalog dropdown.</td>
        <td>Automatically populates standard tuition fee and duration.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Batch Start Date</span></td>
        <td>Calendar date picker for session commencement.</td>
        <td>Assigns learner to the active cohort schedule for roll-call attendance.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Contact Information</span></td>
        <td>Primary mobile (+91), email, guardian name, guardian mobile, city, and area.</td>
        <td>Enables automated WhatsApp / email attendance notifications.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">5</span></td>
        <td><span class="btn-name">Save Record CTA</span></td>
        <td>Click "Save Student &amp; Create Invoice".</td>
        <td>Generates student registration ID, creates billing ledger row, and logs audit event.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 6: INVOICES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">06</span> Invoicing, Payment Recording & GST Compliance</h2>
  <span class="route-pill">Route: /invoices</span>
  <p class="desc">
    Financial ledger compliant with Indian GST laws (HSN/SAC 999293). Record offline tuition fee payments, track installment schedules, and issue digital tax invoices.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgInvoices}" alt="Invoices Ledger" />
    <div class="screenshot-caption">Figure 6.1: Financial billing ledger with status filters, payment CTA, and invoice download buttons.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Action / Output</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Record Payment CTA</span></td>
        <td>Primary button above billing ledger.</td>
        <td>Opens payment recording modal to log incoming offline fee installments.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Billing Status Tabs</span></td>
        <td>Tabs: All Invoices, Paid, Partially Paid, Overdue.</td>
        <td>Filters ledger rows instantly based on outstanding fee balance.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">GST Tax Invoices Table</span></td>
        <td>Displays Invoice #, Student Name, Total Billed, Paid Amount, and Balance.</td>
        <td>Maintains an immutable record of all institutional receivables and tax liabilities.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Download PDF Invoice</span></td>
        <td>Download button next to each invoice row.</td>
        <td>Generates official PDF tax invoice with ThoorigAI GSTIN, CGST/SGST breakdown, and QR code.</td>
      </tr>
    </tbody>
  </table>

  <!-- RECORD PAYMENT MODAL -->
  <h3 class="flow-title avoid-break">Recording an Offline Fee Installment</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgRecordPay}" alt="Record Payment Modal" />
    <div class="screenshot-caption">Figure 6.2: Offline payment recording modal with student selector and payment mode options.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Field</th>
        <th style="width: 32%;">Input Required</th>
        <th style="width: 35%;">Financial Accounting Effect</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Select Student</span></td>
        <td>Search student by name or register ID.</td>
        <td>Displays current outstanding balance and course fee breakdown.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Installment Amount</span></td>
        <td>Enter payment amount in Indian Rupees (INR).</td>
        <td>Validates amount cannot exceed outstanding balance unless advance.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Payment Mode</span></td>
        <td>Select: UPI (GPay/PhonePe), Cash, Bank Transfer (NEFT/IMPS), or Cheque.</td>
        <td>Classifies payment method for accounting ledger export.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">4</span></td>
        <td><span class="btn-name">Transaction Reference</span></td>
        <td>Enter UPI UTR Number, Bank Transaction Ref, or Cash Receipt #.</td>
        <td>Stores unique transaction audit reference to prevent double entry.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">5</span></td>
        <td><span class="btn-name">Save Payment CTA</span></td>
        <td>Click "Save Payment &amp; Issue Receipt".</td>
        <td>Deducts balance, updates invoice status, and records transaction in audit log.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 7: COURSES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">07</span> Course Catalog & Curriculum Configuration</h2>
  <span class="route-pill">Route: /courses</span>
  <p class="desc">
    Configure the academy course catalog, pricing tiers (Essential, Elite, Internship), syllabus duration, and assign certified trainers.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgCourses}" alt="Courses Catalog" />
    <div class="screenshot-caption">Figure 7.1: Course catalog with tier badges, student counts, and course creation triggers.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Element</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Action Performed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Add New Course CTA</span></td>
        <td>Top-right button triggering the course builder.</td>
        <td>Opens modal to create a new academic course in the curriculum catalog.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Course Catalog & Pricing</span></td>
        <td>Grid of all active courses with duration, fee, and enrolled students.</td>
        <td>Click any card to modify syllabus modules, adjust pricing, or archive programs.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 8: MATERIALS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">08</span> Course Materials & Digital Asset Repository</h2>
  <span class="route-pill">Route: /materials</span>
  <p class="desc">
    Digital asset management backed by encrypted cloud storage. Upload presentation slides, lab code files, syllabus guides, and reference documents.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgMaterials}" alt="Course Materials" />
    <div class="screenshot-caption">Figure 8.1: Materials repository with course module filter and secure upload dropzone.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Interaction</th>
        <th style="width: 35%;">Storage Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Course Module Filter</span></td>
        <td>Select course from dropdown.</td>
        <td>Filters file list to show materials assigned to the selected topic.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Upload Materials CTA</span></td>
        <td>Click or drag &amp; drop files (PDF, PPT, ZIP up to 50MB).</td>
        <td>Uploads to private Supabase Storage bucket with presigned download URLs.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Uploaded Digital Files</span></td>
        <td>Table of files with title, size, upload date, and uploader name.</td>
        <td>Provides instant download link or deletion action for obsolete assets.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 9: ATTENDANCE -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">09</span> Daily Attendance Tracking & Roll-Call</h2>
  <span class="route-pill">Route: /attendance</span>
  <p class="desc">
    Daily roll-call attendance system with real-time automated saving. Tracks attendance percentages required for certificate issuance eligibility (75% threshold).
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgAttendance}" alt="Attendance Tracker" />
    <div class="screenshot-caption">Figure 9.1: Attendance roll-call roster with date picker, quick-mark actions, and student grid.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Action Performed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Batch & Session Date</span></td>
        <td>Select target course batch and choose attendance date.</td>
        <td>Renders official student roster for the selected cohort session.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Bulk "Mark All Present"</span></td>
        <td>One-click green action button at top of roster.</td>
        <td>Instantly marks every student in the cohort as "Present" with a single click.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Roll-Call Roster</span></td>
        <td>Individual student rows: click [Present], [Absent], [Late], or [Excused].</td>
        <td>Changes trigger debounced autosave; green confirmation badge verifies database write.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 10: ASSESSMENTS -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">10</span> Assessments Studio & Google Forms Sync</h2>
  <span class="route-pill">Route: /assessments</span>
  <p class="desc">
    Create academic tests, sync Google Forms and Sheets responses, input evaluation marks, and record qualitative trainer remarks in the Grading Studio.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgAssessments}" alt="Assessments Studio" />
    <div class="screenshot-caption">Figure 10.1: Assessments Studio with test creation CTA, Google Forms import, and Grading Studio.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Action</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">New Test CTA</span></td>
        <td>Click "Create Assessment". Enter title, max score, pass threshold, and course.</td>
        <td>Publishes assessment to course syllabus and initiates student evaluation tracking.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Import Google Forms</span></td>
        <td>Click "Import" to link a Google Form or Google Sheet URL.</td>
        <td>Preserves form/sheet links and imports student score columns automatically.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Open Grading Studio</span></td>
        <td>Click "Grade" next to any test to open the evaluation interface.</td>
        <td>Review student submissions, input marks, type qualitative feedback, and save evaluations.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 11: CERTIFICATES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">11</span> Certificate Issuance & QR Verification</h2>
  <span class="route-pill">Routes: /certificates &amp; /verify</span>
  <p class="desc">
    Issue officially authenticated completion certificates. The system automatically enforces two prerequisites: (1) 100% tuition fees cleared, and (2) Assessment pass threshold met.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgCerts}" alt="Certificates Registry" />
    <div class="screenshot-caption">Figure 11.1: Certificate registry displaying issued credentials, verification codes, and PDF generation.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Prerequisites &amp; Action</th>
        <th style="width: 35%;">Output</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Issue Certificate CTA</span></td>
        <td>Click button next to an eligible student with cleared balance.</td>
        <td>Generates unique verification code (e.g. <code>VREF-CERT-1048-A9B8</code>) with timestamp.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Eligible & Issued Registry</span></td>
        <td>Table displaying student name, course, issue date, and certificate ID.</td>
        <td>Maintains an immutable record of all certified graduates.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">3</span></td>
        <td><span class="btn-name">Official PDF with QR</span></td>
        <td>Click "Download" to generate vector-grade certificate PDF.</td>
        <td>Renders printable certificate with ThoorigAI seal, signature, and scan-to-verify QR code.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="flow-title avoid-break">Public Certificate Verification Portal</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgVerify}" alt="Public Verify Portal" />
    <div class="screenshot-caption">Figure 11.2: Public verification portal at /verify allowing employers and students to validate credentials.</div>
  </div>

  <!-- SECTION 12: REPORTS & AUDIT -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">12</span> Business Intelligence, Reports & Audit Log</h2>
  <span class="route-pill">Routes: /reports &amp; /audit-log</span>
  <p class="desc">
    Export financial and academic analytics, and inspect the chronological database audit trail with correlation IDs.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgReportsFin}" alt="Financial Reports" />
    <div class="screenshot-caption">Figure 12.1: Financial reports tab showing monthly collection run-rates and GST tax liabilities.</div>
  </div>

  <table class="steps-table avoid-break">
    <thead>
      <tr>
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Tab / Report</th>
        <th style="width: 32%;">Metrics Provided</th>
        <th style="width: 35%;">Export Capability</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-callout">1</span></td>
        <td><span class="btn-name">Financial Revenue Reports</span></td>
        <td>Tuition collected, course revenue breakdown, and GST tax collected summary.</td>
        <td>Click "Export CSV" to download accounting spreadsheets ready for Tally/Excel.</td>
      </tr>
      <tr>
        <td><span class="badge-callout">2</span></td>
        <td><span class="btn-name">Export Accounting CSV</span></td>
        <td>Top CTA button generating structured CSV ledger.</td>
        <td>Exports transaction records with invoice IDs, student details, and tax breakdowns.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="flow-title avoid-break">Academic Cohort Performance Analytics</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgReportsAcad}" alt="Academic Reports" />
    <div class="screenshot-caption">Figure 12.2: Academic reports tab displaying cohort pass rates, average test scores, and attendance.</div>
  </div>

  <h3 class="flow-title avoid-break">System Forensics & Audit Trail</h3>
  <div class="screenshot-box avoid-break">
    <img src="${imgAudit}" alt="Audit Log Trail" />
    <div class="screenshot-caption">Figure 12.3: Immutable Audit Log recording every administrative and security action.</div>
  </div>

  <!-- SECTION 13: SETTINGS MODULES -->
  <div class="page-break"></div>
  <h2 class="section-title"><span class="section-num">13</span> Academy Settings & System Configuration</h2>
  <span class="route-pill">Routes: /settings/*</span>
  <p class="desc">
    Exhaustive configuration for GST compliance, academy brand identity, trainer mappings, course tiers, skill tags, and personal credentials.
  </p>

  <div class="screenshot-box avoid-break">
    <img src="${imgGst}" alt="GST Settings" />
    <div class="screenshot-caption">Figure 13.1: Tax compliance settings configuring GSTIN, legal business name, and tax breakdown.</div>
  </div>

  <div class="screenshot-box avoid-break">
    <img src="${imgBrand}" alt="Brand Settings" />
    <div class="screenshot-caption">Figure 13.2: Brand identity settings: academy display name, logo upload, and contact info.</div>
  </div>

  <div class="screenshot-box avoid-break">
    <img src="${imgTrainers}" alt="Instructor Assignments" />
    <div class="screenshot-caption">Figure 13.3: Trainer assignment settings mapping instructors to specific courses and batches.</div>
  </div>

  <div class="screenshot-box avoid-break">
    <img src="${imgCats}" alt="Course Categories" />
    <div class="screenshot-caption">Figure 13.4: Course categories manager defining catalog tiers (Essential, Elite, Internship).</div>
  </div>

  <div class="screenshot-box avoid-break">
    <img src="${imgSkills}" alt="Skill Tags" />
    <div class="screenshot-caption">Figure 13.5: Skill tags taxonomy managing technical competencies mapped to courses.</div>
  </div>

  <div class="screenshot-box avoid-break">
    <img src="${imgSettings}" alt="User Settings" />
    <div class="screenshot-caption">Figure 13.6: Personal profile and password update settings for administrators.</div>
  </div>

</body>
</html>`

  const htmlPath = path.join(MANUALS_DIR, 'Thoorigai_Admin_User_Manual.html')
  fs.writeFileSync(htmlPath, html, 'utf8')
  console.log('✓ Wrote Thoorigai_Admin_User_Manual.html')
  return htmlPath
}

async function buildStaffManual() {
  console.log('Assembling Full Comprehensive Staff Manual...')

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
          <strong style="display:block; font-size: 16px; color: #0f172a;">THOORIGAI INFOTECH LLP</strong>
          <span style="font-size: 12px; color: #64748b;">Instructional Operations & Classroom Management</span>
        </div>
      </div>

      <div class="cover-title-group">
        <span class="cover-tag" style="background: #dcfce7; color: #15803d;">Staff &amp; Faculty Complete Guide</span>
        <h1>STAFF &amp; INSTRUCTOR COMPLETE USER MANUAL</h1>
        <p class="cover-subtitle">
          An exhaustive, button-by-button operational handbook for Academy Faculty and Instructors. Covers the OTP invitation registration process, classroom operations, batch roll-call attendance, Google Forms assessment sync, grading studio evaluation, and learning asset uploads.
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
          <strong>Coverage</strong>
          <span>100% Staff Permitted Features</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>ThoorigAI Infotech LLP &bull; Faculty Resource</span>
      <span>Document Ref: THOOR-STF-EXP-2026-v2</span>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Field / Button</th>
        <th style="width: 32%;">Instructions</th>
        <th style="width: 35%;">Validation Rule</th>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Widget / Element</th>
        <th style="width: 32%;">Information Provided</th>
        <th style="width: 35%;">Recommended Action</th>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Action</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Result</th>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Control</th>
        <th style="width: 32%;">Action</th>
        <th style="width: 35%;">System Result</th>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Action</th>
        <th style="width: 32%;">Step Description</th>
        <th style="width: 35%;">Output</th>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Action</th>
        <th style="width: 32%;">Instructions</th>
        <th style="width: 35%;">Storage Details</th>
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
        <th style="width: 8%;">Step</th>
        <th style="width: 25%;">Action</th>
        <th style="width: 32%;">Description</th>
        <th style="width: 35%;">Benefit</th>
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
    headerTemplate: `<div style="font-size: 8px; color: #94a3b8; width: 100%; text-align: right; padding-right: 12mm; font-family: sans-serif;">${documentTitle} &bull; ThoorigAI Infotech LLP</div>`,
    footerTemplate: `<div style="font-size: 8px; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 12mm; font-family: sans-serif;"><span>Confidential & Proprietary</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    margin: {
      top: '14mm',
      bottom: '14mm',
      left: '12mm',
      right: '12mm',
    },
  })

  await browser.close()
  const stats = fs.statSync(pdfPath)
  console.log(`✓ PDF Generated successfully: ${pdfPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
}

async function main() {
  const adminHtml = await buildAdminManual()
  const staffHtml = await buildStaffManual()

  const adminPdf = path.join(MANUALS_DIR, 'Thoorigai_Admin_User_Manual.pdf')
  const staffPdf = path.join(MANUALS_DIR, 'Thoorigai_Staff_User_Manual.pdf')

  await convertHtmlToPdf(adminHtml, adminPdf, 'ADMINISTRATOR OPERATIONS MANUAL')
  await convertHtmlToPdf(staffHtml, staffPdf, 'STAFF & INSTRUCTOR USER MANUAL')

  console.log('\n🎉 Both PDF Manuals successfully generated and compiled!')
  console.log('1. Admin Manual:', adminPdf)
  console.log('2. Staff Manual:', staffPdf)
}

main().catch(err => {
  console.error('Fatal error building manuals:', err)
  process.exit(1)
})
