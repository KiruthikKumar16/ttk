import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { getDashboardSummary } from '@/modules/dashboard/service'

export const GET = withApi({ roles: rolesFor('reports', 'read') }, async () => apiResult(await getDashboardSummary()))
