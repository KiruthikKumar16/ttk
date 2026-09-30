import { rolesFor } from '@/lib/auth/permissions'
import { withApi } from '@/lib/http/handler'

export const GET = withApi({ roles: rolesFor('students', 'read') }, ({ role }) => ({ role }))
