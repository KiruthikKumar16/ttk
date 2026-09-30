import http from 'k6/http'
import { check } from 'k6'

const baseUrl = (__ENV.API_BASE_URL || '').replace(/\/$/, '')
const cookie = __ENV.AUTH_COOKIE_HEADER || ''

export const options = {
  scenarios: {
    list_api_50_rps: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: __ENV.DURATION || '5m',
      preAllocatedVUs: 40,
      maxVUs: 120,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:list}': ['p(95)<300'],
  },
}

const endpoints = [
  '/api/students?page=1&pageSize=50',
  '/api/payments?pageSize=50',
  '/api/attendance?pageSize=50',
  '/api/audit?pageSize=50',
]

export default function () {
  if (!baseUrl || !cookie) throw new Error('Set API_BASE_URL and AUTH_COOKIE_HEADER before running this test.')
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
  const response = http.get(`${baseUrl}${endpoint}`, {
    headers: { Cookie: cookie, Accept: 'application/json' },
    tags: { endpoint: 'list' },
  })
  check(response, {
    'list endpoint returns 200': (result) => result.status === 200,
    'list endpoint returns JSON': (result) => result.headers['Content-Type']?.includes('application/json'),
  })
}
