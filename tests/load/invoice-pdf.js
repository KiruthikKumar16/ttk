import http from 'k6/http'
import { check } from 'k6'

const baseUrl = (__ENV.API_BASE_URL || '').replace(/\/$/, '')
const cookie = __ENV.AUTH_COOKIE_HEADER || ''
const invoice = encodeURIComponent(__ENV.LOADTEST_INVOICE || '')

export const options = {
  scenarios: {
    cached_invoice_pdf: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: __ENV.DURATION || '2m',
      preAllocatedVUs: 10,
      maxVUs: 40,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:invoice_pdf}': ['p(95)<800'],
  },
}

export default function () {
  if (!baseUrl || !cookie || !invoice) {
    throw new Error('Set API_BASE_URL, AUTH_COOKIE_HEADER, and LOADTEST_INVOICE before running this test.')
  }
  const response = http.get(`${baseUrl}/api/invoices/${invoice}/download`, {
    headers: { Cookie: cookie, Accept: 'application/pdf' },
    tags: { endpoint: 'invoice_pdf' },
  })
  check(response, {
    'invoice endpoint returns 200': (result) => result.status === 200,
    'invoice endpoint returns PDF': (result) => result.headers['Content-Type']?.includes('application/pdf'),
    'invoice response has content': (result) => result.body.length > 100,
  })
}
