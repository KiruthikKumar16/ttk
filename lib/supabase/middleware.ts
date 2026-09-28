import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { clientEnv } from '@/lib/env'

function unavailableStatus(error: unknown): 500 | 503 {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return /fetch|network|connection|timeout|timed out|ECONN|unavailable/i.test(message) ? 503 : 500
}

function unauthenticated(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
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
        const requestId = crypto.randomUUID()
        console.error(`[${requestId}] Supabase auth request failed`, error)
        return NextResponse.json(
          { error: 'Authentication service is unavailable.', requestId },
          { status },
        )
      }
      if (typeof error.status === 'number' && error.status < 500) {
        return unauthenticated(request)
      }
      const requestId = crypto.randomUUID()
      console.error(`[${requestId}] Supabase auth request failed`, error)
      return NextResponse.json(
        { error: 'An unexpected authentication error occurred.', requestId },
        { status },
      )
    }
    if (data?.claims) return response
  } catch (error) {
    const requestId = crypto.randomUUID()
    console.error(`[${requestId}] Supabase auth request failed`, error)
    return NextResponse.json(
      {
        error: unavailableStatus(error) === 503
          ? 'Authentication service is unavailable.'
          : 'An unexpected authentication error occurred.',
        requestId,
      },
      { status: unavailableStatus(error) },
    )
  }
  return unauthenticated(request)
}
