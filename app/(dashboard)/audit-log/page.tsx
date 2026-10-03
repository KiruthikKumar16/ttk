import { requirePermission } from '@/lib/auth/current-profile'
import { listAuditPage } from '@/modules/audit/service'
import { parseCursorListQuery } from '@/modules/shared/list-query'
import { AuditLogView } from '@/modules/audit/components/AuditLogView'

export default async function AuditLogPage({ searchParams }: PageProps<'/audit-log'>) {
  await requirePermission('audit', 'read')
  const sp = await searchParams
  const query = parseCursorListQuery(sp)
  const tableName = typeof sp.tableName === 'string' ? sp.tableName : ''
  const action = typeof sp.action === 'string' ? sp.action : ''
  const userName = typeof sp.userName === 'string' ? sp.userName : ''

  const result = await listAuditPage({
    ...query,
    direction: 'desc',
    keyset: true,
    cursor: query.cursor,
    tableName: tableName || undefined,
    action: action || undefined,
    userName: userName || undefined,
  })

  return (
    <AuditLogView
      entries={result.data}
      page={query.page}
      pageSize={query.pageSize}
      search={query.search}
      tableName={tableName}
      action={action}
      userName={userName}
      hasNextPage={result.hasMore ?? false}
      nextCursor={result.nextCursor ?? null}
      cursor={query.cursor}
      previousCursor={query.previousCursor}
    />
  )
}
