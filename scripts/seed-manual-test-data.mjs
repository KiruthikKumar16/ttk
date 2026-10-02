import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
          const key = match[1]
          let value = (match[2] || '').trim()
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
          if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !SUPABASE_URL) SUPABASE_URL = value
          if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !SERVICE_KEY) SERVICE_KEY = value
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided via environment or .env.local',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function seed() {
  console.log('🌱 Starting comprehensive test data seeding for all endpoints...')

  // 1. Get existing admin & staff profiles for foreign keys
  const { data: profiles } = await supabase.from('profiles').select('id, role, full_name')
  const adminProfile = profiles?.find((p) => p.role === 'admin') || profiles?.[0]
  const staffProfile = profiles?.find((p) => p.role === 'staff') || adminProfile
  const adminId = adminProfile.id
  const staffId = staffProfile.id

  console.log(`✓ Using Admin: ${adminProfile.full_name || adminId}, Staff: ${staffProfile.full_name || staffId}`)

  // 2. Ensure Course Categories exist
  console.log('\n📂 Seeding Course Categories...')
  const categories = [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Essential', duration: '6 weeks' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Elite', duration: '12 weeks' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'Internship', duration: '3 Months' },
  ]
  for (const cat of categories) {
    await supabase.from('course_categories').upsert(cat)
  }
  console.log('✓ Course categories synchronized.')

  // 3. Ensure Course Catalog exists
  console.log('\n📚 Seeding Courses...')
  const courses = [
    {
      id: 'CRS-01',
      name: 'Professional Course',
      fee: 4200000,
      duration: '6 Months',
      description: 'Comprehensive software engineering and architecture training.',
      gst_inclusive: false,
      category_id: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'CRS-02',
      name: 'ThoorigAI Course - Internship',
      fee: 3600000,
      duration: '3 Months',
      description: 'Hands-on internship with an AI and full-stack software development focus.',
      gst_inclusive: true,
      category_id: 'c0000000-0000-0000-0000-000000000003',
    },
    {
      id: 'CRS-03',
      name: 'Crash Course (1.5 Months)',
      fee: 2400000,
      duration: '1.5 Months',
      description: 'Intensive modern web development fundamentals and project delivery.',
      gst_inclusive: true,
      category_id: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'CRS-04',
      name: 'Slash Course (1 Month)',
      fee: 1800000,
      duration: '1 Month',
      description: 'Foundational UI and frontend training for career starters.',
      gst_inclusive: false,
      category_id: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'CRS-05',
      name: 'Full Stack Development',
      fee: 4800000,
      duration: '6 Months',
      description: 'Complete full stack engineering with Next.js, Node, and PostgreSQL.',
      gst_inclusive: false,
      category_id: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'CRS-06',
      name: 'Data Science & AI',
      fee: 5200000,
      duration: '6 Months',
      description: 'Machine learning, generative AI, and end-to-end data analytics.',
      gst_inclusive: false,
      category_id: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'CRS-07',
      name: 'UI/UX Design Masterclass',
      fee: 3000000,
      duration: '2 Months',
      description: 'Figma design tokens, prototyping, and accessibility principles.',
      gst_inclusive: true,
      category_id: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'CRS-08',
      name: 'Essential Web Fundamentals',
      fee: 1500000,
      duration: '6 weeks',
      description: 'HTML5, CSS3, JavaScript ESNext, and modern web standards.',
      gst_inclusive: true,
      category_id: 'c0000000-0000-0000-0000-000000000001',
    },
  ]
  for (const crs of courses) {
    await supabase.from('courses').upsert(crs)
  }
  console.log('✓ Course catalog synchronized.')

  // 4. Seed New Students
  console.log('\n👥 Seeding Students...')
  const newStudents = [
    {
      id: 'a0000001-0000-4000-8000-000000000001',
      register_id: 1049,
      name: 'Aravind Swaminathan',
      course: 'Full Stack Development',
      batch: '2026-08-15',
      total: 4800000,
      paid: 2400000,
      status: 'Pending',
      phone: '9840112233',
      alt_phone: '9840112234',
      email: 'aravind.s@example.com',
      gender: 'Male',
      dob: '2000-07-22',
      marital_status: 'Single',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Madurai',
      area: 'KK Nagar',
      lead_source: 'Online Advertisement',
      comments: 'Targeting backend and API engineering positions.',
      knowledge_tags: ['Node.js', 'PostgreSQL', 'Docker'],
    },
    {
      id: 'a0000002-0000-4000-8000-000000000002',
      register_id: 1050,
      name: 'Pooja Ramachandran',
      course: 'Data Science & AI',
      batch: '2026-09-01',
      total: 5200000,
      paid: 0,
      status: 'Pending',
      phone: '9840556677',
      alt_phone: '9840556678',
      email: 'pooja.r@example.com',
      gender: 'Female',
      dob: '2002-03-10',
      marital_status: 'Single',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      area: 'Adyar',
      lead_source: 'Friend Referral',
      comments: 'Strong mathematics background; wants to work in AI models.',
      knowledge_tags: ['Python', 'Machine Learning', 'Data Analysis'],
    },
    {
      id: 'a0000003-0000-4000-8000-000000000003',
      register_id: 1051,
      name: 'Siddharth Balaji',
      course: 'Essential Web Fundamentals',
      batch: '2026-09-10',
      total: 1500000,
      paid: 0,
      status: 'Pending',
      phone: '9840998877',
      alt_phone: '9840998878',
      email: 'siddharth.b@example.com',
      gender: 'Male',
      dob: '2003-11-05',
      marital_status: 'Single',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      area: 'Gandhipuram',
      lead_source: 'Campus Seminar',
      comments: 'Eager to build first portfolio and web applications.',
      knowledge_tags: ['HTML5', 'CSS3', 'JavaScript'],
    },
  ]
  for (const std of newStudents) {
    await supabase.from('students').upsert(std)
  }
  console.log('✓ Students synchronized.')

  // Query all students for relations
  const { data: allStudents } = await supabase.from('students').select('*')
  const stdMap = new Map(allStudents?.map((s) => [s.register_id, s]))

  // 5. Seed Payments & Invoices
  console.log('\n💳 Seeding Payments & Invoices...')
  const paymentsToSeed = [
    {
      id: 'RCPT-2',
      student_id: stdMap.get(1045)?.id, // Rohit Kumar
      student_register_id: 1045,
      method: 'UPI / GPay',
      amount: 450000, // 4,500 rupees base (paise)
      invoice: 'TAI/2026/INV000002',
      payment_date: '2026-09-15',
      gst_rate: 18,
      cgst: 40500,
      sgst: 40500,
      transaction_id: 'UPI-982341209348',
      custom_note: 'Term installment paid via GPay',
    },
    {
      id: 'RCPT-3',
      student_id: stdMap.get(1047)?.id, // Arjun Prakash
      student_register_id: 1047,
      method: 'Bank Transfer',
      amount: 800000, // 8,000 rupees base
      invoice: 'TAI/2026/INV000003',
      payment_date: '2026-09-20',
      gst_rate: 18,
      cgst: 72000,
      sgst: 72000,
      transaction_id: 'NEFT-HDFC00293847',
      custom_note: 'Internship cohort installment 2',
    },
    {
      id: 'RCPT-4',
      student_id: stdMap.get(1049)?.id, // Aravind Swaminathan
      student_register_id: 1049,
      method: 'Credit Card',
      amount: 1200000, // 12,000 rupees base
      invoice: 'TAI/2026/INV000004',
      payment_date: '2026-09-25',
      gst_rate: 18,
      cgst: 108000,
      sgst: 108000,
      transaction_id: 'CARD-AUTH-883921',
      custom_note: 'Course admission initial deposit',
    },
    {
      id: 'RCPT-5',
      student_id: stdMap.get(1050)?.id, // Pooja Ramachandran
      student_register_id: 1050,
      method: 'UPI / GPay',
      amount: 2000000, // 20,000 rupees base
      invoice: 'TAI/2026/INV000005',
      payment_date: '2026-09-28',
      gst_rate: 18,
      cgst: 180000,
      sgst: 180000,
      transaction_id: 'UPI-771239019283',
      custom_note: 'Data Science cohort confirmation fee',
    },
    {
      id: 'RCPT-6',
      student_id: stdMap.get(1051)?.id, // Siddharth Balaji
      student_register_id: 1051,
      method: 'Cash',
      amount: 1500000, // 15,000 rupees base (clears full total!)
      invoice: 'TAI/2026/INV000006',
      payment_date: '2026-09-30',
      gst_rate: 18,
      cgst: 135000,
      sgst: 135000,
      transaction_id: null,
      custom_note: 'Cash paid at academy front desk',
    },
  ]

  for (const p of paymentsToSeed) {
    if (!p.student_id) continue
    const { error } = await supabase.from('payments').upsert(p)
    if (error && !error.message.includes('duplicate key')) {
      console.warn(`Payment ${p.invoice} error:`, error.message)
    }
  }
  console.log('✓ Payments and invoices synchronized.')

  // 6. Seed Attendance (past 14 days)
  console.log('\n📅 Seeding Daily Attendance Records...')
  const attendanceDates = [
    '2026-09-18',
    '2026-09-19',
    '2026-09-21',
    '2026-09-22',
    '2026-09-23',
    '2026-09-24',
    '2026-09-25',
    '2026-09-26',
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
  ]

  const attendanceBatch = []
  for (const s of allStudents || []) {
    for (let i = 0; i < attendanceDates.length; i++) {
      const date = attendanceDates[i]
      let status = 'Present'
      // Introduce realistic attendance variations
      if (s.register_id === 1045) {
        // Rohit Kumar: attendance < 75% for watchlist demonstration
        status = i % 3 === 0 ? 'Absent' : i % 5 === 0 ? 'Late' : 'Present'
      } else if (s.register_id === 1047) {
        status = i === 4 ? 'Absent' : i === 8 ? 'Excused' : 'Present'
      } else {
        status = i === 6 && s.register_id === 1046 ? 'Late' : 'Present'
      }

      // Map course to CRS ID
      let courseId = 'CRS-01'
      if (s.course.includes('Crash')) courseId = 'CRS-03'
      else if (s.course.includes('Slash')) courseId = 'CRS-04'
      else if (s.course.includes('Internship')) courseId = 'CRS-02'
      else if (s.course.includes('Full Stack')) courseId = 'CRS-05'
      else if (s.course.includes('Data Science')) courseId = 'CRS-06'
      else if (s.course.includes('Essential')) courseId = 'CRS-08'

      attendanceBatch.push({
        student_id: s.id,
        course_id: courseId,
        session_date: date,
        status,
        marked_by: staffId,
      })
    }
  }

  // Insert attendance in chunks of 50
  for (let i = 0; i < attendanceBatch.length; i += 50) {
    const chunk = attendanceBatch.slice(i, i + 50)
    await supabase.from('attendance').upsert(chunk, { onConflict: 'student_id,course_id,session_date' })
  }
  console.log(`✓ Seeded ${attendanceBatch.length} attendance session logs.`)

  // 7. Seed Assessments & Results
  console.log('\n📝 Seeding Assessments & Student Exam Results...')
  const assessments = [
    {
      id: 'b0000001-0000-4000-8000-000000000001',
      course_id: 'CRS-01',
      title: 'Sprint 1: TypeScript & Modern React Mastery',
      max_score: 100,
      assessment_date: '2026-09-22',
      created_by: staffId,
    },
    {
      id: 'b0000002-0000-4000-8000-000000000002',
      course_id: 'CRS-02',
      title: 'Internship Milestone: AI Agents & Full-Stack Architecture',
      max_score: 100,
      assessment_date: '2026-09-25',
      created_by: staffId,
    },
    {
      id: 'b0000003-0000-4000-8000-000000000003',
      course_id: 'CRS-03',
      title: 'Crash Course Mid-Term Assessment',
      max_score: 50,
      assessment_date: '2026-09-28',
      created_by: staffId,
    },
    {
      id: 'b0000004-0000-4000-8000-000000000004',
      course_id: 'CRS-06',
      title: 'Python & Data Modeling Foundations Exam',
      max_score: 100,
      assessment_date: '2026-09-29',
      created_by: staffId,
    },
  ]

  for (const asm of assessments) {
    await supabase.from('assessments').upsert(asm)
  }

  const results = [
    {
      assessment_id: 'b0000001-0000-4000-8000-000000000001',
      student_id: stdMap.get(1048)?.id, // Kavya
      score: 94,
      remarks: 'Exemplary component architecture, clean separation of concerns, and robust TypeScript types.',
      graded_by: staffId,
    },
    {
      assessment_id: 'b0000001-0000-4000-8000-000000000001',
      student_id: stdMap.get(1044)?.id, // Divya
      score: 88,
      remarks: 'Great UI responsiveness and state handling. Small improvement suggested in custom hook reuse.',
      graded_by: staffId,
    },
    {
      assessment_id: 'b0000002-0000-4000-8000-000000000002',
      student_id: stdMap.get(1047)?.id, // Arjun
      score: 82,
      remarks: 'Solid tool calling integration and system prompt structuring; passed all evaluation benchmarks.',
      graded_by: staffId,
    },
    {
      assessment_id: 'b0000003-0000-4000-8000-000000000003',
      student_id: stdMap.get(1046)?.id, // Meena
      score: 46,
      remarks: 'Fast execution, accurate semantic markup, and clean CSS flexbox and grid layouts.',
      graded_by: staffId,
    },
    {
      assessment_id: 'b0000004-0000-4000-8000-000000000004',
      student_id: stdMap.get(1050)?.id, // Pooja
      score: 91,
      remarks: 'Outstanding analytical reasoning and pandas data cleansing pipeline implementation.',
      graded_by: staffId,
    },
  ]

  for (const res of results) {
    if (!res.student_id) continue
    await supabase.from('assessment_results').upsert(res, { onConflict: 'assessment_id,student_id' })
  }
  console.log('✓ Assessments and graded student results synchronized.')

  // 8. Seed Course Materials
  console.log('\n📁 Seeding Course Materials...')
  const materials = [
    {
      id: 'd0000001-0000-4000-8000-000000000001',
      course_id: 'CRS-01',
      title: 'Full Stack Architecture & Next.js 16 Cheatsheet',
      type: 'pdf',
      storage_path: 'materials/crs-01-architecture-cheatsheet.pdf',
      uploaded_by: staffId,
    },
    {
      id: 'd0000002-0000-4000-8000-000000000002',
      course_id: 'CRS-02',
      title: 'ThoorigAI Internship Lab Guide & Git Workflow',
      type: 'document',
      storage_path: 'materials/crs-02-internship-lab-guide.docx',
      uploaded_by: staffId,
    },
    {
      id: 'd0000003-0000-4000-8000-000000000003',
      course_id: 'CRS-03',
      title: 'Modern Web Dev Crash Course Starter Kit',
      type: 'zip',
      storage_path: 'materials/crs-03-starter-template.zip',
      uploaded_by: staffId,
    },
    {
      id: 'd0000004-0000-4000-8000-000000000004',
      course_id: 'CRS-06',
      title: 'Data Science Python & NumPy Reference Guide',
      type: 'pdf',
      storage_path: 'materials/crs-06-python-numpy-guide.pdf',
      uploaded_by: staffId,
    },
    {
      id: 'd0000005-0000-4000-8000-000000000005',
      course_id: 'CRS-07',
      title: 'UI/UX Design Tokens & Figma Community Kit',
      type: 'presentation',
      storage_path: 'materials/crs-07-design-tokens.pptx',
      uploaded_by: staffId,
    },
  ]

  for (const m of materials) {
    await supabase.from('course_materials').upsert(m)
  }
  console.log('✓ Course materials catalog synchronized.')

  // 9. Seed Official Certificates & Verifiable Documents
  console.log('\n🎓 Seeding Official Certificates & Public Verification Codes...')
  const certificates = [
    {
      id: 'e0000001-0000-4000-8000-000000000001',
      certificate_id: 'TAI-CERT-2026-001',
      student_id: stdMap.get(1048)?.id, // Kavya
      student_register_id: 1048,
      course_name: 'Professional Course',
      student_name: 'Kavya Srinivasan',
      start_date: '2026-03-01',
      end_date: '2026-09-01',
      issue_date: '2026-09-15',
      skills: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Cloud Architecture'],
      director_name: 'M. Kiruthikkumar',
      trainer_name: 'Lead Instructor',
      custom_note: 'Graduated with high distinction and honors.',
    },
    {
      id: 'e0000002-0000-4000-8000-000000000002',
      certificate_id: 'TAI-CERT-2026-002',
      student_id: stdMap.get(1044)?.id, // Divya
      student_register_id: 1044,
      course_name: 'Professional Course',
      student_name: 'Divya Narayanan',
      start_date: '2026-03-01',
      end_date: '2026-09-01',
      issue_date: '2026-09-18',
      skills: ['React', 'Full Stack Development', 'REST APIs', 'Tailwind CSS'],
      director_name: 'M. Kiruthikkumar',
      trainer_name: 'Lead Instructor',
      custom_note: 'Successfully completed software engineering capstone.',
    },
    {
      id: 'e0000003-0000-4000-8000-000000000003',
      certificate_id: 'TAI-CERT-2026-003',
      student_id: stdMap.get(1046)?.id, // Meena
      student_register_id: 1046,
      course_name: 'Crash Course (1.5 Months)',
      student_name: 'Meena Lakshmi',
      start_date: '2026-07-15',
      end_date: '2026-08-31',
      issue_date: '2026-09-20',
      skills: ['HTML5', 'CSS3', 'Modern JavaScript', 'Responsive UI'],
      director_name: 'M. Kiruthikkumar',
      trainer_name: 'Lead Instructor',
      custom_note: 'Completed intensive web development bootcamp.',
    },
  ]

  for (const cert of certificates) {
    if (!cert.student_id) continue
    await supabase.from('certificates').upsert(cert, { onConflict: 'certificate_id' })
  }

  // Verifiable documents (QR code verification lookup)
  const verifiableDocs = [
    {
      id: 'f0000001-0000-4000-8000-000000000001',
      doc_type: 'certificate',
      reference_id: 'TAI-CERT-2026-001',
      verification_code: 'VREF-CERT-1048-A9B8',
      status: 'active',
      issued_at: '2026-09-15T10:00:00Z',
    },
    {
      id: 'f0000002-0000-4000-8000-000000000002',
      doc_type: 'certificate',
      reference_id: 'TAI-CERT-2026-002',
      verification_code: 'VREF-CERT-1044-C7D6',
      status: 'active',
      issued_at: '2026-09-18T10:00:00Z',
    },
    {
      id: 'f0000003-0000-4000-8000-000000000003',
      doc_type: 'certificate',
      reference_id: 'TAI-CERT-2026-003',
      verification_code: 'VREF-CERT-1046-E5F4',
      status: 'active',
      issued_at: '2026-09-20T10:00:00Z',
    },
    {
      id: 'f0000004-0000-4000-8000-000000000004',
      doc_type: 'invoice',
      reference_id: 'TAI/2026/INV000001',
      verification_code: 'VREF-INV-2026-001',
      status: 'active',
      issued_at: '2026-09-29T10:00:00Z',
    },
    {
      id: 'f0000005-0000-4000-8000-000000000005',
      doc_type: 'invoice',
      reference_id: 'TAI/2026/INV000002',
      verification_code: 'VREF-INV-2026-002',
      status: 'active',
      issued_at: '2026-09-15T10:00:00Z',
    },
  ]

  for (const vdoc of verifiableDocs) {
    await supabase.from('verifiable_documents').upsert(vdoc, { onConflict: 'verification_code' })
  }
  console.log('✓ Certificates and public verification documents synchronized.')

  // 10. Seed One-Time Invite Codes (OTP)
  console.log('\n🔑 Seeding One-Time Invite Codes...')
  const now = Date.now()
  const inviteCodes = [
    {
      id: '10000001-0000-4000-8000-000000000001',
      code: 'THOORIGAI-DEV-STAFF-2026',
      role: 'staff',
      created_by: adminId,
      expires_at: new Date(now + 24 * 3600 * 1000).toISOString(), // 24 hours left
      recipient_email: null,
      is_used: false,
    },
    {
      id: '10000002-0000-4000-8000-000000000002',
      code: 'THOORIGAI-DEV-ADMIN-2026',
      role: 'admin',
      created_by: adminId,
      expires_at: new Date(now + 7 * 24 * 3600 * 1000).toISOString(), // 7 days left
      recipient_email: null,
      is_used: false,
    },
    {
      id: '10000003-0000-4000-8000-000000000003',
      code: 'THOORIGAI-VIP-STAFF',
      role: 'staff',
      created_by: adminId,
      expires_at: new Date(now + 48 * 3600 * 1000).toISOString(),
      recipient_email: 'instructor@thoorigai.local',
      is_used: false,
    },
    {
      id: '10000004-0000-4000-8000-000000000004',
      code: 'THOORIGAI-EXPIRED-CODE',
      role: 'staff',
      created_by: adminId,
      expires_at: new Date(now - 24 * 3600 * 1000).toISOString(), // Expired yesterday
      recipient_email: null,
      is_used: false,
    },
    {
      id: '10000005-0000-4000-8000-000000000005',
      code: 'THOORIGAI-USED-CODE',
      role: 'staff',
      created_by: adminId,
      expires_at: new Date(now + 12 * 3600 * 1000).toISOString(),
      recipient_email: null,
      is_used: true,
      used_at: new Date(now - 3600 * 1000).toISOString(),
    },
  ]

  for (const ic of inviteCodes) {
    await supabase.from('invite_codes').upsert(ic, { onConflict: 'code' })
  }
  console.log('✓ Invite codes (active, admin, restricted, expired, used) synchronized.')

  // 11. Seed Pending Access User (for approval testing)
  console.log('\n⏳ Seeding Pending Access User for Admin Approval...')
  const pendingUser = {
    id: '90000001-0000-4000-8000-000000000001',
    role: 'pending',
    full_name: 'Rajesh Kumar (New Applicant)',
  }
  await supabase.from('profiles').upsert(pendingUser)
  console.log('✓ Pending user approval row synchronized.')

  // 12. Seed Recent Audit Log Records
  console.log('\n📋 Seeding Audit Log Activity...')
  const auditEntries = [
    {
      id: 'c0000001-0000-4000-8000-000000000001',
      actor_id: adminId,
      actor_role: 'admin',
      action: 'student.create',
      entity_type: 'students',
      entity_id: 'a0000001-0000-4000-8000-000000000001',
      metadata: { registerId: 1049, name: 'Aravind Swaminathan', course: 'Full Stack Development' },
      created_at: new Date(now - 3600 * 1000 * 4).toISOString(),
    },
    {
      id: 'c0000002-0000-4000-8000-000000000002',
      actor_id: staffId,
      actor_role: 'staff',
      action: 'payment.create',
      entity_type: 'payments',
      entity_id: 'RCPT-4',
      metadata: { invoice: 'TAI/2026/INV000004', amount: 1200000, method: 'Credit Card' },
      created_at: new Date(now - 3600 * 1000 * 3).toISOString(),
    },
    {
      id: 'c0000003-0000-4000-8000-000000000003',
      actor_id: staffId,
      actor_role: 'staff',
      action: 'assessment.grade',
      entity_type: 'assessment_results',
      entity_id: 'b0000001-0000-4000-8000-000000000001',
      metadata: { student: 'Kavya Srinivasan', score: 94, maxScore: 100 },
      created_at: new Date(now - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'c0000004-0000-4000-8000-000000000004',
      actor_id: adminId,
      actor_role: 'admin',
      action: 'certificate.issue',
      entity_type: 'certificates',
      entity_id: 'TAI-CERT-2026-001',
      metadata: { student: 'Kavya Srinivasan', certificateId: 'TAI-CERT-2026-001' },
      created_at: new Date(now - 3600 * 1000 * 1).toISOString(),
    },
  ]

  for (const log of auditEntries) {
    await supabase.from('audit_log').upsert(log)
  }
  console.log('✓ Audit log synchronized.')

  console.log('\n🎉 ALL ENDPOINTS SEEDED SUCCESSFULLY!')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
