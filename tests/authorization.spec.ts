import { test, expect } from '@playwright/test'

test('staff JWT permits assigned role capabilities and blocks financial and course management data', async ({
  playwright,
  baseURL,
}) => {
  const staff = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/staff.json' })
  try {
    const students = await staff.get('/api/students?page=1&pageSize=5')
    expect(students.status()).toBe(200)
    const payments = await staff.get('/api/payments?page=1&pageSize=5')
    expect(payments.status()).toBe(403)
    const certificates = await staff.get('/api/certificates?page=1&pageSize=5')
    expect(certificates.status()).toBe(403)
    const courses = await staff.get('/api/courses?page=1&pageSize=5')
    expect(courses.status()).toBe(403)
  } finally {
    await staff.dispose()
  }
})

test('admin can access payments, courses, certificates, and students', async ({ playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/admin.json' })
  try {
    expect((await admin.get('/api/students?page=1&pageSize=5')).status()).toBe(200)
    expect((await admin.get('/api/payments?page=1&pageSize=5')).status()).toBe(200)
    expect((await admin.get('/api/courses?page=1&pageSize=5')).status()).toBe(200)
    expect((await admin.get('/api/certificates?page=1&pageSize=5')).status()).toBe(200)
  } finally {
    await admin.dispose()
  }
})

test('real seeded staff JWT follows the API read-permission matrix', async ({ playwright, baseURL }) => {
  const staff = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/staff.json' })
  const staffAllowed = [
    '/api/students?page=1&pageSize=5',
    '/api/attendance?page=1&pageSize=5',
    '/api/assessments?page=1&pageSize=5',
    '/api/course-materials?page=1&pageSize=5',
    '/api/reports',
    '/api/reports/export?startDate=2026-09-01&endDate=2026-09-29',
    '/api/session',
  ]
  const staffDenied = [
    '/api/payments?page=1&pageSize=5',
    '/api/courses?page=1&pageSize=5',
    '/api/certificates?page=1&pageSize=5',
    '/api/gst',
    '/api/audit',
    '/api/admin/users',
  ]
  try {
    for (const path of staffAllowed) expect((await staff.get(path)).status(), `staff ${path}`).toBe(200)
    for (const path of staffDenied) expect((await staff.get(path)).status(), `staff ${path}`).toBe(403)
  } finally {
    await staff.dispose()
  }
})

test('anonymous JWT context receives 401 from every protected feature API', async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
  const protectedRoutes = [
    '/api/session',
    '/api/students?page=1&pageSize=5',
    '/api/payments?page=1&pageSize=5',
    '/api/courses?page=1&pageSize=5',
    '/api/certificates?page=1&pageSize=5',
    '/api/attendance?page=1&pageSize=5',
    '/api/assessments?page=1&pageSize=5',
    '/api/course-materials?page=1&pageSize=5',
    '/api/reports',
    '/api/gst',
    '/api/audit',
    '/api/admin/users',
  ]
  try {
    for (const path of protectedRoutes) expect((await anonymous.get(path)).status(), `anonymous ${path}`).toBe(401)
  } finally {
    await anonymous.dispose()
  }
})
