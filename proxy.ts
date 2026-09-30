import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimit } from '@/lib/security/rate-limit'
import { logProductEvent } from '@/lib/logger'

function securityHeaders(response: NextResponse, csp: string, requestId: string) {
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('x-request-id', requestId)
  return response
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
  const analyticsOrigin = 'https://va.vercel-scripts.com'
  const insightsOrigin = 'https://vitals.vercel-insights.com'
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} ${analyticsOrigin}`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^https:/, 'wss:')} ${insightsOrigin}`,
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  request.headers.set('x-nonce', nonce)
  const requestId = crypto.randomUUID()
  request.headers.set('x-request-id', requestId)
  request.headers.set('Content-Security-Policy', csp)
  const path = request.nextUrl.pathname
  const rule = path.startsWith('/api/verify/')
    ? { key: `verify:${clientIp(request)}`, limit: 10, window: '1 m' as const }
    : null
  if (rule) {
    try {
      const result = await rateLimit(rule.key, rule.limit, rule.window)
      if (!result.success) {
        logProductEvent('verification_rate_limited', requestId)
        const response = NextResponse.json(
          { error: 'Too many requests.' },
          {
            status: 429,
            headers: { 'Retry-After': String(result.retryAfterSeconds), 'x-request-id': requestId },
          },
        )
        return securityHeaders(response, csp, requestId)
      }
    } catch {
      const response = NextResponse.json(
        { error: { message: 'Service temporarily unavailable.', requestId } },
        {
          status: 503,
          headers: { 'x-request-id': requestId },
        },
      )
      return securityHeaders(response, csp, requestId)
    }
  }
  if (path === '/api/health' || path === '/api/ready') {
    const response = NextResponse.next({ request: { headers: request.headers } })
    return securityHeaders(response, csp, requestId)
  }
  const response = await updateSession(request)
  return securityHeaders(response, csp, requestId)
}

function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
