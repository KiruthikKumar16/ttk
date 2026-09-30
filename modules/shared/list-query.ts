import { z } from 'zod'
import { pagePagination } from '@/lib/pagination'

const listParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).default(''),
  sort: z.string().trim().max(32).default(''),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const cursorListParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).default(''),
  cursor: z.string().max(1024).optional(),
  previousCursor: z.string().max(1024).optional(),
})

export function parseListQuery(searchParams: Record<string, string | string[] | undefined>) {
  const parsed = listParamsSchema.parse({
    page: searchParams.page,
    pageSize: searchParams.pageSize,
    search: Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search,
    sort: Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort,
    direction: Array.isArray(searchParams.direction) ? searchParams.direction[0] : searchParams.direction,
  })
  return { ...parsed, pagination: pagePagination(parsed.page, parsed.pageSize) }
}

export function parseCursorListQuery(searchParams: Record<string, string | string[] | undefined>) {
  const parsed = cursorListParamsSchema.parse({
    page: searchParams.page,
    pageSize: searchParams.pageSize,
    search: Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search,
    cursor: Array.isArray(searchParams.cursor) ? searchParams.cursor[0] : searchParams.cursor,
    previousCursor: Array.isArray(searchParams.previousCursor)
      ? searchParams.previousCursor[0]
      : searchParams.previousCursor,
  })
  return parsed
}
