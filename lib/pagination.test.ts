import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  decodeCursor,
  encodeCursor,
  collectPages,
  pagePagination,
  pagePaginationFromSearchParams,
  paginationMeta,
} from './pagination'

describe('pagination helpers', () => {
  it('returns bounded offset pagination', () => {
    expect(pagePagination()).toEqual({ page: 1, pageSize: 25, offset: 0, limit: 25 })
    expect(pagePagination(3, 100)).toEqual({ page: 3, pageSize: 100, offset: 200, limit: 100 })
    expect(() => pagePagination(0, 10)).toThrow()
    expect(() => pagePagination(1, 101)).toThrow()
    expect(() => pagePagination(Number.MAX_SAFE_INTEGER, 100)).toThrow()
  })

  it('validates URL pagination and default values', () => {
    expect(pagePaginationFromSearchParams(new URLSearchParams('courseId=1'))).toEqual({
      page: 1,
      pageSize: 25,
      offset: 0,
      limit: 25,
    })
    expect(pagePaginationFromSearchParams(new URLSearchParams('page=2&pageSize=25'))).toMatchObject({ offset: 25 })
    expect(() => pagePaginationFromSearchParams(new URLSearchParams('page=0'))).toThrow()
    expect(() => pagePaginationFromSearchParams(new URLSearchParams('pageSize=1000'))).toThrow()
  })

  it('builds page metadata, including an empty result set', () => {
    expect(paginationMeta(235, { page: 2, pageSize: 100 })).toEqual({
      page: 2,
      pageSize: 100,
      totalCount: 235,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true,
    })
    expect(paginationMeta(0, { page: 1, pageSize: 50 })).toMatchObject({
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    })
  })

  it('encodes and validates keyset cursors', () => {
    const cursor = encodeCursor({ createdAt: '2026-09-28T00:00:00Z', id: 'row-1' })
    expect(decodeCursor(cursor, z.object({ createdAt: z.string(), id: z.string() }))).toEqual({
      createdAt: '2026-09-28T00:00:00Z',
      id: 'row-1',
    })
    expect(() => encodeCursor(undefined)).toThrow()
    expect(() => decodeCursor('not-a-cursor', z.object({ id: z.string() }))).toThrow()
    expect(() => decodeCursor(encodeCursor({ id: 7 }), z.object({ id: z.string() }))).toThrow()
  })

  it('collects bounded pages until the declared result count is reached', async () => {
    const calls: number[] = []
    const rows = await collectPages(async ({ page }) => {
      calls.push(page)
      const allRows = ['a', 'b', 'c']
      return { data: allRows.slice((page - 1) * 2, page * 2), totalCount: allRows.length }
    }, 2)
    expect(rows).toEqual(['a', 'b', 'c'])
    expect(calls).toEqual([1, 2])
    await expect(collectPages(async () => ({ data: [], totalCount: 0 }))).resolves.toEqual([])
  })
})
