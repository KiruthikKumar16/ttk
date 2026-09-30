const baseUrl = process.argv[2]
if (!baseUrl) {
  console.error('Usage: node scripts/check-security-headers.mjs <base-url>')
  process.exit(2)
}

const response = await fetch(new URL('/api/health', baseUrl), { redirect: 'manual' })
const h = response.headers
const csp = h.get('content-security-policy') ?? ''
const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? ''
const styleSrc = csp.split(';').find((part) => part.trim().startsWith('style-src ')) ?? ''
const styleSrcAttr = csp.split(';').find((part) => part.trim().startsWith('style-src-attr')) ?? ''
const checks = [
  [
    'CSP nonce and restrictive script policy',
    /'nonce-[^']+'/.test(scriptSrc) && !scriptSrc.includes("'unsafe-inline'") && !scriptSrc.includes("'unsafe-eval'"),
  ],
  [
    'CSP nonce styles and scoped inline style attributes',
    /'nonce-[^']+'/.test(styleSrc) && !styleSrc.includes("'unsafe-inline'") && styleSrcAttr.includes("'unsafe-inline'"),
  ],
  ['CSP frame ancestors', /frame-ancestors 'none'/.test(csp)],
  ['HSTS', /max-age=\d{7,}/i.test(h.get('strict-transport-security') ?? '')],
  ['nosniff', h.get('x-content-type-options') === 'nosniff'],
  ['Referrer policy', h.get('referrer-policy') === 'strict-origin-when-cross-origin'],
  [
    'Permissions policy',
    /camera=\(\)/.test(h.get('permissions-policy') ?? '') &&
      /microphone=\(\)/.test(h.get('permissions-policy') ?? '') &&
      /geolocation=\(\)/.test(h.get('permissions-policy') ?? ''),
  ],
  ['COOP', h.get('cross-origin-opener-policy') === 'same-origin'],
  ['CORP', h.get('cross-origin-resource-policy') === 'same-origin'],
]
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`)
const passed = checks.filter(([, ok]) => ok).length
console.log(`Local security-header grade: ${passed === checks.length ? 'A' : 'F'} (${passed}/${checks.length})`)
if (passed !== checks.length) process.exit(1)
