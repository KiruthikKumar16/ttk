import { z } from 'zod'
import { ValidationError } from '@/lib/http/errors'

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
}).passthrough()

export type PagePagination = {
  page: number
  pageSize: number
  offset: number
  limit: number
}

export function pagePagination(page = 1, pageSize = DEFAULT_PAGE_SIZE): PagePagination {
  if (!Number.isSafeInteger(page) || page < 1) throw new ValidationError('Page must be a positive integer.')
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new ValidationError(`Page size must be between 1 and ${MAX_PAGE_SIZE}.`)
  }
  const offset = (page - 1) * pageSize
  if (!Number.isSafeInteger(offset)) throw new ValidationError('Page offset is outside the supported range.')
  return { page, pageSize, offset, limit: pageSize }
}

export function pagePaginationFromSearchParams(params: URLSearchParams): PagePagination {
  const parsed = paginationQuerySchema.safeParse(Object.fromEntries(params.entries()))
  if (!parsed.success) {
    throw new ValidationError('Invalid pagination parameters.', parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })))
  }
  return pagePagination(parsed.data.page, parsed.data.pageSize)
}

export function paginationMeta(totalCount: number, pagination: Pick<PagePagination, 'page' | 'pageSize'>) {
  const totalPages = Math.ceil(totalCount / pagination.pageSize)
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: pagination.page > 1,
    hasNextPage: pagination.page < totalPages,
  }
}

export function encodeCursor<T>(cursor: T): string {
  const json = JSON.stringify(cursor)
  if (json === undefined) throw new ValidationError('Cursor value cannot be serialized.')
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function decodeCursor<T>(cursor: string, schema: z.ZodType<T>): T {
  try {
    const base64 = cursor.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
    const decoded: unknown = JSON.parse(new TextDecoder().decode(bytes))
    return schema.parse(decoded)
  } catch {
    throw new ValidationError('Cursor is invalid or has expired.')
  }
}

export async function collectPages<T>(
  loadPage: (pagination: PagePagination) => Promise<{ data: T[]; totalCount: number }>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = []
  let page = 1
  let totalCount = Number.POSITIVE_INFINITY
  while (rows.length < totalCount) {
    const pagination = pagePagination(page, pageSize)
    const result = await loadPage(pagination)
    rows.push(...result.data)
    totalCount = result.totalCount
    if (result.data.length === 0) break
    page += 1
  }
  return rows
}
