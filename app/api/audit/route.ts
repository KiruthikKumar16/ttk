import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unexpectedApiError } from '@/lib/api-response'
import { pagePaginationFromSearchParams } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    return new NextResponse(JSON.stringify({ error: 'Unable to fetch user profile' }), { status: 500 })
  }

  // Only admin can access audit logs
  if (profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to access audit logs' }), { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const paymentId = searchParams.get('paymentId')
    const pagination = pagePaginationFromSearchParams(searchParams)
    const tableName = searchParams.get('tableName') // 'payments' or 'students'
    const action = searchParams.get('action') // 'insert', 'update', 'delete'

    // Build query
    let query = supabase.from('audit_log').select(`
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
    `, { count: 'exact' })

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

    // Order by changed_at descending (most recent first)
    query = query.order('changed_at', { ascending: false })

    // Apply pagination
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      count,
      page: pagination.page,
      pageSize: pagination.pageSize,
      hasMore: (pagination.offset + pagination.limit) < (count || 0)
    })
  } catch (error) {
    return unexpectedApiError(error, 'Failed to fetch audit logs')
  }
}
