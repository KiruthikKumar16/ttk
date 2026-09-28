import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { ZodTypeAny } from 'zod'
import { ZodError, z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'
import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { AppError, InternalError, UnauthorizedError, ValidationError } from '@/lib/http/errors'

type ApiOptions = {
  query?: ZodTypeAny
  body?: ZodTypeAny
  params?: ZodTypeAny
  successStatus?: number
} & (
  | { public: true; roles?: never }
  | { public?: false; roles: readonly Role[] }
)

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

function parseSchema<TSchema extends ZodTypeAny>(schema: TSchema, value: unknown, label: string): z.infer<TSchema> {
  try {
    return schema.parse(value)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(`Invalid ${label}.`, error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })))
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
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
        requestId,
      },
    },
    { status: error.status, headers: { 'x-request-id': requestId } },
  )
}

function successResponse(result: unknown, successStatus: number, requestId: string) {
  const response = result && typeof result === 'object' && 'data' in result
    ? result as ApiResult<unknown>
    : { data: result }
  const status = response.status ?? successStatus
  return NextResponse.json(
    { data: response.data, ...(response.meta === undefined ? {} : { meta: response.meta }) },
    { status, headers: { 'x-request-id': requestId } },
  )
}

export function withApi<
  TOptions extends ApiOptions,
  TResult,
>(
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

    try {
      let supabase: SupabaseClient | undefined
      let user: User | undefined
      let role: Role | undefined

      if (options.public !== true) {
        supabase = await createClient()
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) throw new UnauthorizedError()
        user = data.user

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profileError) throw new InternalError('Unable to load authorization profile.')

        if (profile?.role !== 'admin' && profile?.role !== 'staff' && profile?.role !== 'trainer') {
          throw new UnauthorizedError('An authorized profile is required.')
        }
        role = profile.role
        requireRole(role, options.roles ?? [])
      }

      const query = (options.query
        ? parseSchema(options.query, queryObject(request), 'query parameters')
        : undefined) as InferSchema<TOptions['query']>
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
      const params = (options.params
        ? parseSchema(options.params, rawParams ?? {}, 'route parameters')
        : undefined) as InferSchema<TOptions['params']>

      const result = await handler({
        request,
        requestId,
        query,
        body,
        params,
        user,
        role,
        supabase,
      })
      return successResponse(result, options.successStatus ?? 200, requestId)
    } catch (error) {
      if (error instanceof AppError) return failureResponse(error, requestId)

      logger.error(
        { requestId, errorType: error instanceof Error ? error.name : typeof error },
        'Unhandled API error',
      )
      return failureResponse(new InternalError(), requestId)
    }
  }
}
