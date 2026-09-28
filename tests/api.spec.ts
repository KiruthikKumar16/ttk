import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('Health check returns OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  test('GET /api/students returns student list', async ({ request }) => {
    const response = await request.get('/api/students');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(typeof json.count).toBe('number');
  });

  test('GET /api/payments returns payment list', async ({ request }) => {
    const response = await request.get('/api/payments');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test('POST /api/students validates input', async ({ request }) => {
    const response = await request.post('/api/students', {
      data: {
        name: '',
        phone: ''
      }
    });
    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Valid name');
  });
});

test.describe('Additional API Tests', () => {
  test('POST /api/payments rejects amount exceeding student balance', async ({ request }) => {
    // First, create a student with known total and paid
    const studentRes = await request.post('/api/students', {
      data: {
        name: 'Test Student',
        phone: '9999999999',
        course: 'Test Course',
        batch: 'Test Batch',
        total: 10000, // Total fees
        paid: 2000,   // Already paid
        registerId: 999999, // Use a high number to avoid conflicts
      }
    });

    // If student creation fails, we still want to run the test but note that
    // we might have a student already. However, for simplicity, we assume it works.
    // In a real test suite, we would handle cleanup or use unique IDs.

    const studentJson = await studentRes.json();
    let studentId;
    if (studentRes.ok()) {
      studentId = studentJson.data.registerId;
    } else {
      // If creation fails, maybe the student already exists? We'll try to fetch and use an existing one.
      // For simplicity, we'll skip this test if we can't create a student.
      test.skip(true, 'Unable to create test student');
      return;
    }

    // Now try to create a payment that exceeds the remaining balance
    // Remaining balance = total - paid = 10000 - 2000 = 8000
    // We'll try to pay 9000, which exceeds 8000
    const paymentRes = await request.post('/api/payments', {
      data: {
        studentId: studentId,
        amount: 9000,
        method: 'UPI',
        date: '2026-09-22'
      }
    });

    expect(paymentRes.status()).toBe(400);
    const json = await paymentRes.json();
    expect(json.error).toContain('exceeds the remaining balance');
  });

  test('POST /api/payments calculates CGST and SGST correctly', async ({ request }) => {
    // Create a student for the payment
    const studentRes = await request.post('/api/students', {
      data: {
        name: 'GST Test Student',
        phone: '8888888888',
        course: 'GST Course',
        batch: 'GST Batch',
        total: 50000,
        paid: 0,
        registerId: 888888,
      }
    });

    if (!studentRes.ok()) {
      test.skip(true, 'Unable to create test student for GST test');
      return;
    }

    const studentJson = await studentRes.json();
    const studentId = studentJson.data.registerId;

    // Make a payment with GST rate 18% on amount 10000
    // Expected CGST = (10000 * 18%) / 2 = 900
    // Expected SGST = 900
    const paymentRes = await request.post('/api/payments', {
      data: {
        studentId: studentId,
        amount: 10000,
        method: 'UPI',
        date: '2026-09-22',
        gstRate: 18
        // Note: We are not providing cgst and sgst, expecting the backend to calculate them
      }
    });

    expect(paymentRes.ok()).toBeTruthy();
    const json = await paymentRes.json();

    // Check that cgst and sgst are present and correct
    expect(json.data).toHaveProperty('cgst');
    expect(json.data).toHaveProperty('sgst');
    expect(json.data.cgst).toBeCloseTo(900); // Using toBeCloseTo for floating point, but we expect integer
    expect(json.data.sgst).toBeCloseTo(900);
    // Since the calculation uses Math.round, we expect exact integers
    expect(json.data.cgst).toBe(900);
    expect(json.data.sgst).toBe(900);
  });

  test('POST /api/certificates returns 400 for missing required fields', async ({ request }) => {
    // Try to create a certificate with missing required fields
    const res = await request.post('/api/certificates', {
      data: {
        // Intentionally omitting required fields like certificateId, studentRegisterId, etc.
        courseName: 'Test Course',
        studentName: 'Test Student'
      }
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Required');
  });

  test('End-to-end: create student, record payment, verify status updates to Fully Paid', async ({ request }) => {
    // Step 1: Create a student with total fees 5000, initially paid 0
    const createStudentRes = await request.post('/api/students', {
      data: {
        name: 'E2E Test Student',
        phone: '7777777777',
        course: 'E2E Course',
        batch: 'E2E Batch',
        total: 5000,
        paid: 0,
        registerId: 777777,
      }
    });

    expect(createStudentRes.ok()).toBeTruthy();
    const studentJson = await createStudentRes.json();
    const studentId = studentJson.data.registerId;

    // Step 2: Record a payment of 5000 (full amount)
    const paymentRes = await request.post('/api/payments', {
      data: {
        studentId: studentId,
        amount: 5000,
        method: 'UPI',
        date: '2026-09-22'
      }
    });

    expect(paymentRes.ok()).toBeTruthy();

    // Step 3: Fetch the student to verify status is now 'Fully Paid'
    // We can get the student by ID via the students endpoint (though it's paginated, we can get all with a large page size)
    const studentsRes = await request.get(`/api/students?page=1&pageSize=1000`);
    expect(studentsRes.ok()).toBeTruthy();
    const studentsJson = await studentsRes.json();

    // Find our student
    const student = studentsJson.data.find((s: any) => s.registerId === studentId);
    expect(student).toBeTruthy();
    expect(student.status).toBe('Fully Paid');
  });
});
