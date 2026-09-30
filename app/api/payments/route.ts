import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { paginationQuerySchema } from '@/lib/pagination'
import { recordPaymentSchema } from '@/modules/payments/schema'
import { createPayment, listPaymentPage } from '@/modules/payments/service'

export const GET = withApi(
  { roles: rolesFor('payments', 'read'), query: paginationQuerySchema },
  async ({ query, request }) => {
    const url = new URL(request.url)
    const keyset = typeof query.cursor === 'string' || !url.searchParams.has('page')
    const result = await listPaymentPage({
      ...query,
      search: String(query.search ?? ''),
      sort: String(query.sort ?? 'payment_date'),
      direction: query.direction === 'asc' ? 'asc' : 'desc',
      keyset,
      cursor: typeof query.cursor === 'string' ? query.cursor : undefined,
    })
    return apiResult(result.data, {
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        ...('hasMore' in result ? { hasMore: result.hasMore, nextCursor: result.nextCursor } : {}),
      },
    })
  },
)

export const POST = withApi(
  {
    roles: rolesFor('payments', 'create'),
    body: recordPaymentSchema,
    successStatus: 201,
    userRateLimit: { limit: 20, window: '1 m' },
  },
  async ({ body, request }) =>
    apiResult(await createPayment(body, request.headers.get('Idempotency-Key')), { status: 201 }),
)
