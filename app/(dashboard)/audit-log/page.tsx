import { requirePermission } from '@/lib/auth/current-profile'
import { listAuditPage } from '@/modules/audit/service'
import { parseCursorListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'

export default async function AuditLogPage({ searchParams }: PageProps<'/audit-log'>) {
  await requirePermission('audit', 'read')
  const query = parseCursorListQuery(await searchParams)
  const result = await listAuditPage({ ...query, direction: 'desc', keyset: true, cursor: query.cursor })
  return (
    <RecordList
      title="Audit Log"
      description="Review updates to student, payment, and course records."
      basePath="/audit-log"
      page={query.page}
      pageSize={query.pageSize}
      keyset
      cursor={query.cursor}
      previousCursor={query.previousCursor}
      nextCursor={result.nextCursor}
      search={query.search}
    >
      <thead>
        <tr>
          <th>Changed at</th>
          <th>Table</th>
          <th>Record ID</th>
          <th>Action</th>
          <th>Changed by</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((row) => (
          <tr key={row.id}>
            <td>{new Date(row.changedAt).toLocaleString('en-IN')}</td>
            <td>{row.tableName}</td>
            <td>{row.recordId}</td>
            <td>{row.action}</td>
            <td>{row.actor}</td>
          </tr>
        ))}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={5}>No audit records match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
