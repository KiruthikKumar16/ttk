import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Role } from '@/lib/types'
import { currentRequestId } from '@/lib/observability/request-context'

export async function adminMfaResponse(supabase: SupabaseClient, role: Role) {
  if (role !== 'admin') return null
  const { data, error } = await supabase.auth.getClaims()
  if (!error && data?.claims.aal === 'aal2') return null
  const requestId = currentRequestId()
  return NextResponse.json(
    { error: { code: 'MFA_REQUIRED', message: 'Additional authentication is required.', requestId } },
    {
      status: 403,
      headers: { 'x-request-id': requestId },
    },
  )
}
