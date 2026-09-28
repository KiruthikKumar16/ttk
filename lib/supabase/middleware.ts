import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { clientEnv } from '@/lib/env'

function unavailableStatus(error: unknown): 500 | 503 {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return /fetch|network|connection|timeout|timed out|ECONN|unavailable/i.test(message) ? 503 : 500
}

function unauthenticated(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const requestId = crypto.randomUUID()
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
      { status: 401, headers: { 'x-request-id': requestId } },
    )
  }
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

function authenticationFailure(status: 500 | 503, message: string, error: unknown) {
  const requestId = crypto.randomUUID()
  const errorType = error instanceof Error ? error.name : typeof error
  console.error(`[${requestId}] Supabase authentication failed (${errorType})`)
  return NextResponse.json(
    { error: { code: status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR', message, requestId } },
    { status, headers: { 'x-request-id': requestId } },
  )
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const publicPath =
    pathname === '/login' ||
    pathname === '/api/health' ||
    pathname.startsWith('/verify/') ||
    pathname.startsWith('/api/verify/')
  if (publicPath) return NextResponse.next({ request })

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error) {
      const status = unavailableStatus(error)
      if (status === 500 && error.name === 'AuthSessionMissingError') {
        return unauthenticated(request)
      }
      if (status !== 500) {
        return authenticationFailure(status, 'Authentication service is unavailable.', error)
      }
      if (typeof error.status === 'number' && error.status < 500) {
        return unauthenticated(request)
      }
      return authenticationFailure(status, 'An unexpected authentication error occurred.', error)
    }
    if (data?.claims) return response
  } catch (error) {
    const status = unavailableStatus(error)
    return authenticationFailure(
      status,
      status === 503 ? 'Authentication service is unavailable.' : 'An unexpected authentication error occurred.',
      error,
    )
  }
  return unauthenticated(request)
}
