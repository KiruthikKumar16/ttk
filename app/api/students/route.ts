import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { paginationQuerySchema } from '@/lib/pagination'
import { createStudentSchema } from '@/modules/students/schema'
import { createStudent, listStudentPage } from '@/modules/students/service'

export const GET = withApi({ roles: rolesFor('students', 'read'), query: paginationQuerySchema }, async ({ query }) => {
  const result = await listStudentPage({
    ...query,
    search: String(query.search ?? ''),
    sort: String(query.sort ?? 'register_id'),
    direction: query.direction === 'asc' ? 'asc' : 'desc',
  })
  return apiResult(result.data, {
    meta: { page: result.page, pageSize: result.pageSize, totalCount: result.totalCount },
  })
})

export const POST = withApi(
  { roles: rolesFor('students', 'create'), body: createStudentSchema, successStatus: 201 },
  async ({ body }) => apiResult(await createStudent(body), { status: 201 }),
)
