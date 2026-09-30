import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeJoined } from '@/lib/supabase/relations'
import { decodeCursor, encodeCursor } from '@/lib/pagination'
import { z } from 'zod'

export async function listAuditPage(options: {
  page: number
  pageSize: number
  search: string
  direction: 'asc' | 'desc'
  keyset?: boolean
  cursor?: string
}) {
  const supabase = await createClient()
  const offset = (options.page - 1) * options.pageSize
  let query = supabase
    .from('audit_log')
    .select(
      'id,table_name,record_id,action,changed_at,profiles(full_name)',
      options.keyset ? undefined : { count: 'exact' },
    )
  const cursorSchema = z.object({ at: z.string().datetime({ offset: true }), id: z.number().int().positive() })
  if (options.keyset && options.cursor) {
    const cursor = decodeCursor(options.cursor, cursorSchema)
    query = query.or(`changed_at.lt.${cursor.at},and(changed_at.eq.${cursor.at},id.lt.${cursor.id})`)
  }
  if (options.search) {
    const term = options.search
      .trim()
      .slice(0, 100)
      .replace(/[\\%_,()]/g, ' ')
    query = query.or(`record_id.ilike.%${term}%,table_name.ilike.%${term}%,action.ilike.%${term}%`)
  }
  const orderedQuery = options.keyset
    ? query
        .order('changed_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(options.pageSize + 1)
    : query.order('changed_at', { ascending: options.direction === 'asc' }).range(offset, offset + options.pageSize - 1)
  const { data: rawData, error, count } = await orderedQuery
  if (error) throw error
  const hasMore = Boolean(options.keyset && rawData && rawData.length > options.pageSize)
  const data = options.keyset ? (rawData ?? []).slice(0, options.pageSize) : rawData
  return {
    totalCount: count ?? 0,
    ...(options.keyset
      ? {
          hasMore,
          nextCursor:
            hasMore && data?.length
              ? encodeCursor({ at: String(data[data.length - 1].changed_at), id: Number(data[data.length - 1].id) })
              : null,
        }
      : {}),
    data: (data ?? []).map((row) => {
      const profile = normalizeJoined(row.profiles)
      return {
        id: Number(row.id),
        tableName: String(row.table_name),
        recordId: String(row.record_id),
        action: String(row.action),
        changedAt: String(row.changed_at),
        actor: profile?.full_name ? String(profile.full_name) : '—',
      }
    }),
  }
}
