import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'

export const POST = withApi({ roles: rolesFor('reports', 'read') }, async ({ supabase }) => {
  const { error } = await supabase!.auth.signOut({ scope: 'local' })
  if (error) throw error
  return apiResult({ message: 'Signed out.' })
})
