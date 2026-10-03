import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeJoined } from '@/lib/supabase/relations'
import { decodeCursor, encodeCursor } from '@/lib/pagination'
import { z } from 'zod'

export type AuditEntry = {
  id: number
  tableName: string
  recordId: string
  action: 'insert' | 'update' | 'delete'
  changedAt: string
  actor: string
  actorRole: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
}

export async function listAuditPage(options: {
  page: number
  pageSize: number
  search: string
  direction: 'asc' | 'desc'
  keyset?: boolean
  cursor?: string
  tableName?: string
  action?: string
}) {
  const supabase = await createClient()
  const offset = (options.page - 1) * options.pageSize
  let query = supabase
    .from('audit_log')
    .select(
      'id,table_name,record_id,action,changed_at,old_values,new_values,profiles(full_name,role)',
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
  if (options.tableName) {
    query = query.eq('table_name', options.tableName)
  }
  if (options.action) {
    query = query.eq('action', options.action)
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
    data: (data ?? []).map((row): AuditEntry => {
      const profile = normalizeJoined(row.profiles)
      return {
        id: Number(row.id),
        tableName: String(row.table_name),
        recordId: String(row.record_id),
        action: String(row.action) as AuditEntry['action'],
        changedAt: String(row.changed_at),
        actor: profile?.full_name ? String(profile.full_name) : '—',
        actorRole: profile?.role ? String(profile.role) : null,
        oldValues: (row.old_values as Record<string, unknown>) ?? null,
        newValues: (row.new_values as Record<string, unknown>) ?? null,
      }
    }),
  }
}
