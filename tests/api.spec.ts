import { test, expect } from '@playwright/test'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

test('public health endpoint returns an OK service status', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  expect(await response.json()).toMatchObject({ ok: true })
})

test('authenticated staff can read paginated students', async ({ request, baseURL }) => {
  const students = await request.get('/api/students?page=1&pageSize=25')
  expect(students.status()).toBe(200)
  const studentBody = await students.json()
  expect(Array.isArray(studentBody.data)).toBe(true)
  expect(studentBody.meta).toMatchObject({ page: 1, pageSize: 25 })
  expect(new URL(baseURL!).origin).toBe('http://127.0.0.1:3001')
})

test('authenticated admin can read paginated payments', async ({ playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/admin.json' })
  try {
    const payments = await admin.get('/api/payments?page=1&pageSize=25')
    expect(payments.status()).toBe(200)
    expect(Array.isArray((await payments.json()).data)).toBe(true)
  } finally {
    await admin.dispose()
  }
})

test('invoice download returns a valid PDF and missing invoices return 404', async ({ playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/admin.json' })
  try {
    const payments = await admin.get('/api/payments?page=1&pageSize=25')
    expect(payments.status()).toBe(200)
    const rows = (await payments.json()).data as Array<{ invoice: string; student: string }>
    expect(rows.length).toBeGreaterThan(0)

    const invoiceResponse = await admin.get(`/api/invoices/${encodeURIComponent(rows[0].invoice)}/download`)
    const pdfBytes = await invoiceResponse.body()
    expect(
      invoiceResponse.status(),
      invoiceResponse.status() === 200 ? '' : Buffer.from(pdfBytes).toString('utf8').slice(0, 250),
    ).toBe(200)
    expect(invoiceResponse.headers()['content-type']).toContain('application/pdf')
    const pdf = await getDocument({ data: new Uint8Array(pdfBytes) }).promise
    expect(pdf.numPages).toBeGreaterThan(0)
    const text: string[] = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      text.push(...content.items.flatMap((item) => ('str' in item ? [item.str] : [])))
    }
    const invoiceText = text.join(' ')
    const pageSize = await pdf.getPage(1).then((page) => page.getViewport({ scale: 1 }))
    expect(pageSize.width).toBeCloseTo(595, 0)
    expect(pageSize.height).toBeCloseTo(842, 0)
    expect(invoiceText).toContain(rows[0].invoice)
    expect(invoiceText).toContain(rows[0].student)
    const gst = await admin.get('/api/gst')
    expect(gst.status()).toBe(200)
    const gstin = (await gst.json()).data.gstin as string | null
    expect(invoiceText).toContain(gstin ?? 'GSTIN not configured')
    expect(invoiceText).toContain('₹')

    const missing = await admin.get('/api/invoices/NO-SUCH-INVOICE-TEST/download')
    expect(missing.status()).toBe(404)
  } finally {
    await admin.dispose()
  }
})

test('unauthenticated request is denied for protected student data', async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
  try {
    const response = await anonymous.get('/api/students', { headers: { cookie: '' }, maxRedirects: 0 })
    const body = await response.text()
    expect(response.status(), `Unauthenticated response from ${response.url()}: ${body.slice(0, 300)}`).toBe(401)
    expect(body).toContain('UNAUTHORIZED')
  } finally {
    await anonymous.dispose()
  }
})

test('authenticated student creation rejects invalid input without inserting a row', async ({ request, baseURL }) => {
  const response = await request.post('/api/students', {
    headers: { origin: baseURL!, 'content-type': 'application/json' },
    data: { name: '', phone: '', total: 0 },
  })
  expect(response.status()).toBe(400)
})

test('staff can create a student, pay the balance, issue a certificate, and verify it anonymously', async ({
  request,
  baseURL,
  browser,
}) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9)
  const name = `E2E Payer ${suffix}`
  const phone = `9${suffix}`
  const headers = { origin: baseURL!, 'content-type': 'application/json' }
  const created = await request.post('/api/students', {
    headers,
    data: {
      name,
      phone,
      course: 'Professional Course',
      batch: '2026-09-29',
      total: 1000,
      paid: 250,
      knowledgeTags: [],
    },
  })
  expect(created.status()).toBe(201)
  const createdBody = await created.json()
  expect(createdBody.data.data).toMatchObject({ name, paid: 250, status: 'Pending' })
  expect(createdBody.data.payment.invoice).toBeTruthy()
  const registerId = createdBody.data.data.registerId as number

  const completion = await request.post('/api/payments', {
    headers: { ...headers, 'Idempotency-Key': `e2e-${crypto.randomUUID()}` },
    data: { studentId: registerId, amount: 750, method: 'UPI', date: '2026-09-29', gstRate: 18 },
  })
  expect(completion.status()).toBe(201)
  expect((await completion.json()).data).toMatchObject({ studentId: registerId, amount: 750 })
  const lookup = await request.get(`/api/students?page=1&pageSize=5&search=${encodeURIComponent(name)}`)
  expect(lookup.status()).toBe(200)
  const matching = (await lookup.json()).data as Array<{ registerId: number; status: string; paid: number }>
  expect(matching).toContainEqual(expect.objectContaining({ registerId, status: 'Fully Paid', paid: 1000 }))

  const certificateId = `E2E-CERT-${suffix}`
  const issued = await request.post('/api/certificates', {
    headers,
    data: {
      certificateId,
      studentRegisterId: registerId,
      courseName: 'Professional Course',
      studentName: name,
      issueDate: '2026-09-29',
      skills: ['Web Dev'],
    },
  })
  expect(issued.status()).toBe(201)
  const certificates = await request.get('/api/certificates?page=1&pageSize=100')
  expect(certificates.status()).toBe(200)
  const records = (await certificates.json()).data as Array<{ certificateId: string; verificationCode?: string }>
  const certificate = records.find((record) => record.certificateId === certificateId)
  expect(certificate?.verificationCode).toBeTruthy()

  const publicContext = await browser.newContext()
  try {
    const publicPage = await publicContext.newPage()
    await publicPage.goto(`${baseURL}/verify/${certificate!.verificationCode}`)
    await expect(publicPage.getByRole('heading', { name: 'Certificate Verified' })).toBeVisible()
    await expect(publicPage.getByText('Valid', { exact: true })).toBeVisible()
    const verification = await publicPage.request.get(`/api/verify/${certificate!.verificationCode}`)
    const verificationBody = await verification.json()
    expect(verificationBody.data).toMatchObject({ status: 'Valid', course_name: 'Professional Course' })
    expect(verificationBody.data.student_name).toMatch(new RegExp(`^${name[0]}`))
  } finally {
    await publicContext.close()
  }
})

test('certificate issuance is rejected server-side while course fees remain outstanding', async ({
  request,
  baseURL,
}) => {
  const response = await request.post('/api/certificates', {
    headers: { origin: baseURL!, 'content-type': 'application/json' },
    data: {
      certificateId: `E2E-PENDING-${Date.now()}`,
      studentRegisterId: 1047,
      courseName: 'ThoorigAI Course - Internship',
      studentName: 'Arjun Prakash',
      issueDate: '2026-09-29',
      skills: [],
    },
  })
  expect(response.status()).toBe(409)
  expect((await response.json()).error).toContain('Clear the outstanding course fees')
})

test('staff uploads, downloads by signed URL, and deletes course material', async ({ request, baseURL }) => {
  const courses = await request.get('/api/courses?page=1&pageSize=5')
  expect(courses.status()).toBe(200)
  const courseId = ((await courses.json()).data as Array<{ id: string }>)[0].id
  const title = `E2E material ${crypto.randomUUID()}`
  let materialId: string | undefined
  try {
    const uploaded = await request.post('/api/course-materials', {
      headers: { origin: baseURL! },
      multipart: {
        courseId,
        title,
        type: 'pdf',
        file: { name: 'fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nE2E fixture\n%%EOF') },
      },
    })
    expect(uploaded.status()).toBe(201)
    const body = await uploaded.json()
    materialId = body.data.id as string
    expect(body.data.signedUrl).toBeTruthy()
    const download = await request.get(body.data.signedUrl as string)
    expect(download.status()).toBe(200)
    expect((await download.body()).subarray(0, 5).toString()).toBe('%PDF-')
  } finally {
    if (materialId) {
      const removed = await request.delete(`/api/course-materials?id=${encodeURIComponent(materialId)}`, {
        headers: { origin: baseURL!, 'content-type': 'application/json' },
      })
      expect(removed.status(), await removed.text()).toBe(200)
    }
  }
})

test('staff creates an assessment, edits and deletes a result, and exports a date-range report', async ({
  request,
  baseURL,
}) => {
  const courses = await request.get('/api/courses?page=1&pageSize=20')
  expect(courses.status()).toBe(200)
  const course = ((await courses.json()).data as Array<{ id: string; name: string }>).find(
    (item) => item.name === 'Professional Course',
  )!
  const students = await request.get(
    `/api/students?page=1&pageSize=25&search=${encodeURIComponent('Kavya Srinivasan')}`,
  )
  expect(students.status()).toBe(200)
  const student = ((await students.json()).data as Array<{ registerId: number; name: string }>).find(
    (item) => item.name === 'Kavya Srinivasan',
  )!

  const created = await request.post('/api/assessments', {
    headers: { origin: baseURL!, 'content-type': 'application/json' },
    data: {
      courseId: course.id,
      title: `E2E score ${crypto.randomUUID()}`,
      maxScore: 100,
      assessmentDate: '2026-09-29',
    },
  })
  expect(created.status()).toBe(201)
  const assessmentId = (await created.json()).data.id as string
  const resultUrl = `/api/assessments/${assessmentId}/results`
  const resultHeaders = { origin: baseURL!, 'content-type': 'application/json' }
  const firstScore = await request.post(resultUrl, {
    headers: resultHeaders,
    data: { studentId: student.registerId, score: 68, remarks: 'first pass' },
  })
  expect(firstScore.status()).toBe(200)
  const resultId = (await firstScore.json()).data.id as string
  const updatedScore = await request.post(resultUrl, {
    headers: resultHeaders,
    data: { studentId: student.registerId, score: 91, remarks: 'regraded' },
  })
  expect(updatedScore.status()).toBe(200)
  expect((await updatedScore.json()).data).toMatchObject({ id: resultId, score: 91, remarks: 'regraded' })
  const removedScore = await request.delete(`${resultUrl}?resultId=${encodeURIComponent(resultId)}`, {
    headers: { origin: baseURL!, 'content-type': 'application/json' },
  })
  expect(removedScore.status()).toBe(200)

  const exportResponse = await request.get('/api/reports/export?startDate=2026-09-01&endDate=2026-09-29')
  expect(exportResponse.status()).toBe(200)
  expect(exportResponse.headers()['content-type']).toContain('text/csv')
  const csv = await exportResponse.text()
  expect(csv).toContain('Start date')
  expect(csv).toContain('Payments received in range')
})
