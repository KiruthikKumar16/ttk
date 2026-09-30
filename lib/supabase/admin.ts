import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { clientEnv } from '@/lib/env'
import { getServerEnv } from '@/lib/env.server'

export function getSupabaseAdminClient(requestId?: string) {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv()

  return createSupabaseClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: requestId ? { headers: { 'x-request-id': requestId } } : undefined,
  })
}
