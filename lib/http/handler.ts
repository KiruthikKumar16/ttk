import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { ZodTypeAny } from 'zod'
import { ZodError, z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'
import { logger, logProductEvent } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { createHash } from 'node:crypto'
import { withRequestContext } from '@/lib/observability/request-context'
import { requireRole } from '@/lib/auth/requireRole'
import { AppError, InternalError, RateLimitError, UnauthorizedError, ValidationError } from '@/lib/http/errors'
import { rateLimit } from '@/lib/security/rate-limit'
import { validateMutationRequest } from '@/lib/security/csrf'

type ApiOptions = {
  query?: ZodTypeAny
  body?: ZodTypeAny
  params?: ZodTypeAny
  successStatus?: number
  requireAal2?: boolean
  allowAdminAal1?: boolean
  mutationContentTypes?: readonly string[]
  userRateLimit?: { limit: number; window: '1 m' | '15 m' }
} & ({ public: true; roles?: never } | { public?: false; roles: readonly Role[] })

type InferSchema<TSchema> = TSchema extends ZodTypeAny ? z.infer<TSchema> : undefined

export type ApiResult<T> = {
  data: T
  meta?: unknown
  status?: number
}

export function apiResult<T>(data: T, options: Omit<ApiResult<T>, 'data'> = {}): ApiResult<T> {
  return { data, ...options }
}

export type ApiContext<TQuery, TBody, TParams> = {
  request: Request
  requestId: string
  query: TQuery
  body: TBody
  params: TParams
  user?: User
  role?: Role
  supabase?: SupabaseClient
}

type RouteContext = { params?: Promise<Record<string, string>> }
type ApiHandler<Q, B, P, R> = (context: ApiContext<Q, B, P>) => R | Promise<R>

function getRequestId(request: Request): string {
  const incoming = request.headers.get('x-request-id')?.trim()
  if (incoming && incoming.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(incoming)) return incoming
  return crypto.randomUUID()
}

function safeRoute(pathname: string) {
  return pathname
    .split('/')
    .map((segment, index, segments) => {
      if (index > 0 && ['verify', 'invoices'].includes(segments[index - 1] ?? ''))
        return `[${segments[index - 1] === 'verify' ? 'code' : 'invoice'}]`
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment) || /^\d{5,}$/.test(segment)) return '[id]'
      return segment
    })
    .join('/')
}

function recordRouteEvent(pathname: string, method: string, status: number, requestId: string) {
  if (method === 'POST' && pathname === '/api/payments' && status >= 500) {
    logProductEvent('payment_failed', requestId, { status })
  }
  if (status < 200 || status >= 400) return
  if (method === 'POST' && pathname === '/api/payments') {
    logProductEvent('payment_recorded', requestId)
    logProductEvent('invoice_generated', requestId)
  }
  if (method === 'POST' && pathname === '/api/certificates') logProductEvent('certificate_issued', requestId)
  if (pathname.startsWith('/api/course-materials') && status >= 500) logProductEvent('storage_error', requestId)
}

function parseSchema<TSchema extends ZodTypeAny>(schema: TSchema, value: unknown, label: string): z.infer<TSchema> {
  try {
    return schema.parse(value)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        `Invalid ${label}.`,
        error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      )
    }
    throw error
  }
}

function queryObject(request: Request): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {}
  new URL(request.url).searchParams.forEach((value, key) => {
    const previous = result[key]
    if (previous === undefined) result[key] = value
    else if (Array.isArray(previous)) previous.push(value)
    else result[key] = [previous, value]
  })
  return result
}

function failureResponse(error: AppError, requestId: string) {
  const headers = new Headers({ 'x-request-id': requestId })
  if (error.status === 429 && error instanceof Error && 'retryAfterSeconds' in error) {
    headers.set('Retry-After', String((error as AppError & { retryAfterSeconds?: number }).retryAfterSeconds ?? 60))
  }
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
        requestId,
      },
    },
    { status: error.status, headers },
  )
}

function successResponse(result: unknown, successStatus: number, requestId: string) {
  if (result instanceof Response) {
    if (!result.headers.has('x-request-id')) result.headers.set('x-request-id', requestId)
    return result
  }
  const response =
    result && typeof result === 'object' && 'data' in result ? (result as ApiResult<unknown>) : { data: result }
  const status = response.status ?? successStatus
  return NextResponse.json(
    { data: response.data, ...(response.meta === undefined ? {} : { meta: response.meta }) },
    { status, headers: { 'x-request-id': requestId } },
  )
}

export function withApi<TOptions extends ApiOptions, TResult>(
  options: TOptions,
  handler: ApiHandler<
    InferSchema<TOptions['query']>,
    InferSchema<TOptions['body']>,
    InferSchema<TOptions['params']>,
    TResult
  >,
) {
  if (options.public !== true && !('roles' in options)) {
    throw new Error('withApi requires roles for protected handlers; use public: true for public handlers.')
  }
  if (options.public === true && 'roles' in options) {
    throw new Error('Public handlers cannot declare roles.')
  }

  return async (request: Request, routeContext?: RouteContext) => {
    const requestId = getRequestId(request)
    const startedAt = performance.now()
    const pathname = safeRoute(new URL(request.url).pathname)
    let status = 500
    let userIdHash: string | undefined

    try {
      let supabase: SupabaseClient | undefined
      let user: User | undefined
      let role: Role | undefined

      if (options.public !== true) {
        supabase = await createClient(requestId)
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) throw new UnauthorizedError()
        user = data.user
        userIdHash = createHash('sha256').update(user.id).digest('hex').slice(0, 16)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profileError) throw new InternalError()

        if (profile?.role !== 'admin' && profile?.role !== 'staff' && profile?.role !== 'trainer') {
          throw new UnauthorizedError('An authorized profile is required.')
        }
        role = profile.role
        requireRole(role, options.roles ?? [])
        if (options.userRateLimit && user) {
          let result: Awaited<ReturnType<typeof rateLimit>>
          try {
            result = await rateLimit(
              `user:${user.id}:${new URL(request.url).pathname}`,
              options.userRateLimit.limit,
              options.userRateLimit.window,
            )
          } catch {
            throw new AppError('Service temporarily unavailable.', 503, 'INTERNAL_ERROR')
          }
          if (!result.success) {
            throw new RateLimitError('Too many requests.', result.retryAfterSeconds)
          }
        }
      }

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const rejected = validateMutationRequest(
          request,
          options.mutationContentTypes ? [...options.mutationContentTypes] : ['application/json'],
        )
        if (rejected) {
          status = rejected.status
          return rejected
        }
      }

      const query = (
        options.query ? parseSchema(options.query, queryObject(request), 'query parameters') : undefined
      ) as InferSchema<TOptions['query']>
      let body = undefined as InferSchema<TOptions['body']>
      if (options.body) {
        let rawBody: unknown
        try {
          rawBody = await request.json()
        } catch {
          throw new ValidationError('Request body must contain valid JSON.')
        }
        body = parseSchema(options.body, rawBody, 'request body') as InferSchema<TOptions['body']>
      }
      const rawParams = routeContext?.params ? await routeContext.params : undefined
      const params = (
        options.params ? parseSchema(options.params, rawParams ?? {}, 'route parameters') : undefined
      ) as InferSchema<TOptions['params']>

      const result = await withRequestContext({ requestId, userIdHash }, () =>
        handler({
          request,
          requestId,
          query,
          body,
          params,
          user,
          role,
          supabase,
        }),
      )
      const response = successResponse(result, options.successStatus ?? 200, requestId)
      status = response.status
      return response
    } catch (error) {
      if (error instanceof AppError) {
        status = error.status
        if (error.status >= 500) {
          Sentry.withScope((scope) => {
            scope.setTag('request_id', requestId)
            scope.setTag('route', pathname)
            if (userIdHash) scope.setTag('user_id_hash', userIdHash)
            Sentry.captureException(error)
          })
        }
        return failureResponse(error, requestId)
      }

      Sentry.withScope((scope) => {
        scope.setTag('request_id', requestId)
        scope.setTag('route', pathname)
        if (userIdHash) scope.setTag('user_id_hash', userIdHash)
        Sentry.captureException(error)
      })
      logger.error(
        { requestId, route: pathname, userIdHash, errorType: error instanceof Error ? error.name : typeof error },
        'Unhandled API error',
      )
      return failureResponse(new InternalError(), requestId)
    } finally {
      recordRouteEvent(new URL(request.url).pathname, request.method, status, requestId)
      logger.info(
        {
          requestId,
          userIdHash,
          route: pathname,
          method: request.method,
          durationMs: Math.round(performance.now() - startedAt),
          status,
        },
        'HTTP request completed',
      )
    }
  }
}
