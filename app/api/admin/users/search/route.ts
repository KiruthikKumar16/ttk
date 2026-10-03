import { withApi } from '@/lib/http/handler'

export const GET = withApi({ roles: ['admin'] }, async ({ request, supabase }) => {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabase!.from('profiles').select('id, full_name, role').order('full_name').limit(20)

  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return data ?? []
})
