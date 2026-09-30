import { test, expect } from '@playwright/test'

test('trainer JWT permits assigned role capabilities and blocks payment data', async ({ playwright, baseURL }) => {
  const trainer = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/trainer.json' })
  try {
    const students = await trainer.get('/api/students?page=1&pageSize=5')
    expect(students.status()).toBe(200)
    const payments = await trainer.get('/api/payments?page=1&pageSize=5')
    expect(payments.status()).toBe(403)
  } finally {
    await trainer.dispose()
  }
})

test('admin without MFA is denied protected APIs and staff can access payments', async ({ playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/admin.json' })
  const staff = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/staff.json' })
  try {
    expect((await admin.get('/api/students?page=1&pageSize=5')).status()).toBe(403)
    expect((await staff.get('/api/payments?page=1&pageSize=5')).status()).toBe(200)
  } finally {
    await Promise.all([admin.dispose(), staff.dispose()])
  }
})

test('real seeded staff and trainer JWTs follow the API read-permission matrix', async ({ playwright, baseURL }) => {
  const staff = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/staff.json' })
  const trainer = await playwright.request.newContext({ baseURL, storageState: 'tests/.auth/trainer.json' })
  const staffAllowed = [
    '/api/students?page=1&pageSize=5',
    '/api/payments?page=1&pageSize=5',
    '/api/courses?page=1&pageSize=5',
    '/api/certificates?page=1&pageSize=5',
    '/api/attendance?page=1&pageSize=5',
    '/api/assessments?page=1&pageSize=5',
    '/api/course-materials?page=1&pageSize=5',
    '/api/reports',
    '/api/reports/export?startDate=2026-09-01&endDate=2026-09-29',
    '/api/gst',
    '/api/session',
  ]
  const trainerAllowed = [
    '/api/students?page=1&pageSize=5',
    '/api/courses?page=1&pageSize=5',
    '/api/certificates?page=1&pageSize=5',
    '/api/attendance?page=1&pageSize=5',
    '/api/assessments?page=1&pageSize=5',
    '/api/course-materials?page=1&pageSize=5',
    '/api/reports',
    '/api/session',
  ]
  const staffDenied = ['/api/audit', '/api/admin/users']
  const trainerDenied = [
    '/api/payments?page=1&pageSize=5',
    '/api/gst',
    '/api/audit',
    '/api/admin/users',
    '/api/reports/export?startDate=2026-09-01&endDate=2026-09-29',
  ]
  try {
    for (const path of staffAllowed) expect((await staff.get(path)).status(), `staff ${path}`).toBe(200)
    for (const path of trainerAllowed) expect((await trainer.get(path)).status(), `trainer ${path}`).toBe(200)
    for (const path of staffDenied) expect((await staff.get(path)).status(), `staff ${path}`).toBe(403)
    for (const path of trainerDenied) expect((await trainer.get(path)).status(), `trainer ${path}`).toBe(403)
  } finally {
    await Promise.all([staff.dispose(), trainer.dispose()])
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
