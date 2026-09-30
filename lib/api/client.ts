'use client'

export type ApiEnvelope<T> = { data: T; meta?: unknown }

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const body = (await response.json()) as ApiEnvelope<T> & { error?: { message?: string; code?: string } }
  if (!response.ok)
    throw new ApiClientError(body.error?.message ?? 'The request failed.', response.status, body.error?.code)
  return body
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T, TBody>(path: string, body: TBody, options: { idempotencyKey?: string } = {}) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
    }),
}
