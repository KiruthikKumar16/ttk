import { withApi } from '@/lib/http/handler'
import { listAuditPage } from '@/modules/audit/service'

export const GET = withApi({ roles: ['admin'] }, async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)))
  const search = searchParams.get('search')?.trim() || ''
  const tableName = searchParams.get('tableName')?.trim() || undefined
  const action = searchParams.get('action')?.trim() || undefined
  const userId = searchParams.get('userId')?.trim() || undefined
  const userName = searchParams.get('userName')?.trim() || undefined

  const result = await listAuditPage({
    page,
    pageSize,
    search,
    direction: 'desc',
    tableName,
    action,
    userId,
    userName,
  })

  return {
    data: result.data,
    count: result.totalCount,
    page,
    pageSize,
  }
})
