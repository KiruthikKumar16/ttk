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
