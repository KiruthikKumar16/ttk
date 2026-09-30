import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unexpectedApiError } from '@/lib/api-response'
import { decodeCursor, encodeCursor, pagePaginationFromSearchParams } from '@/lib/pagination'
import { z } from 'zod'
import { adminMfaResponse } from '@/lib/security/admin-mfa'
import { withApi } from '@/lib/http/handler'

async function getAuditLog(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch the user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (profileError || !profile) {
    return new NextResponse(JSON.stringify({ error: 'Unable to process the request.' }), { status: 500 })
  }

  // Only admin can access audit logs
  if (profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to access audit logs' }), { status: 403 })
  }
  const mfaResponse = await adminMfaResponse(supabase, profile.role)
  if (mfaResponse) return mfaResponse

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const paymentId = searchParams.get('paymentId')
    const pagination = pagePaginationFromSearchParams(searchParams)
    const keyset = searchParams.has('cursor') || !searchParams.has('page')
    const tableName = searchParams.get('tableName') // 'payments' or 'students'
    const action = searchParams.get('action') // 'insert', 'update', 'delete'

    // Build query
    let query = supabase.from('audit_log').select(
      `
      id,
      table_name,
      record_id,
      action,
      changed_by,
      changed_at,
      old_values,
      new_values,
      profiles!audit_log_changed_by_fkey (
        id,
        role,
        full_name
      )
    `,
      keyset ? undefined : { count: 'exact' },
    )

    // Apply filters
    if (studentId) {
      query = query.eq('record_id', studentId)
    }
    if (paymentId) {
      query = query.eq('record_id', paymentId)
    }
    if (tableName) {
      query = query.eq('table_name', tableName)
    }
    if (action) {
      query = query.eq('action', action)
    }

    const cursorSchema = z.object({ at: z.string().datetime({ offset: true }), id: z.number().int().positive() })
    const cursorToken = searchParams.get('cursor')
    if (keyset && cursorToken) {
      const cursor = decodeCursor(cursorToken, cursorSchema)
      query = query.or(`changed_at.lt.${cursor.at},and(changed_at.eq.${cursor.at},id.lt.${cursor.id})`)
    }

    const orderedQuery = keyset
      ? query
          .order('changed_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(pagination.pageSize + 1)
      : query
          .order('changed_at', { ascending: false })
          .order('id', { ascending: false })
          .range(pagination.offset, pagination.offset + pagination.limit - 1)
    const { data: rawData, error, count } = await orderedQuery

    if (error) throw error
    const hasMore = Boolean(keyset && rawData && rawData.length > pagination.pageSize)
    const data = keyset ? (rawData ?? []).slice(0, pagination.pageSize) : rawData
    const last = data?.at(-1)
    const nextCursor = hasMore && last ? encodeCursor({ at: String(last.changed_at), id: Number(last.id) }) : null

    return NextResponse.json({
      data,
      count,
      page: pagination.page,
      pageSize: pagination.pageSize,
      hasMore: keyset ? hasMore : pagination.offset + pagination.limit < (count || 0),
      ...(keyset ? { nextCursor } : {}),
    })
  } catch (error) {
    return unexpectedApiError(error, 'Failed to fetch audit logs')
  }
}

export const GET = withApi({ roles: ['admin'] as const }, async ({ request }) => getAuditLog(request as NextRequest))
