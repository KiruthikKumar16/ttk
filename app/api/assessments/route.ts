import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assessmentSchema } from '@/lib/validation'
import { unexpectedApiError } from '@/lib/api-response'
import { normalizeJoined } from '@/lib/supabase/relations'
import z from 'zod'
import { pagePaginationFromSearchParams } from '@/lib/pagination'
import { validateMutationRequest } from '@/lib/security/csrf'
import { withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'

async function getAssessments(req: NextRequest) {
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()
  if (!currentProfile) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const pagination = pagePaginationFromSearchParams(searchParams)

    let query = supabase.from('assessments').select(
      `
        id,
        course_id,
        title,
        max_score,
        assessment_date,
        form_url,
        sheet_url,
        created_by,
        created_at,
        courses!assessments_course_id_fkey (id, name),
        profiles!assessments_created_by_fkey (id, full_name, role)
      `,
      { count: 'exact' },
    )

    // Apply filters
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    let formattedData: any[] = []
    let totalCount = 0

    const { data, error, count } = await query
      .order('assessment_date', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)

    if (!error && data) {
      totalCount = count || data.length
      formattedData = data.map((record: any) => {
        const course = normalizeJoined(record.courses)
        const profile = normalizeJoined(record.profiles)
        return {
          id: record.id,
          courseId: record.course_id,
          courseName: course?.name,
          title: record.title,
          maxScore: record.max_score,
          assessmentDate: record.assessment_date,
          formUrl: record.form_url ?? null,
          sheetUrl: record.sheet_url ?? null,
          createdBy: profile
            ? {
                id: profile.id,
                fullName: profile.full_name,
                role: profile.role,
              }
            : null,
          createdAt: record.created_at,
        }
      })
    } else {
      // Resilient fallback query if specific joined foreign keys or optional columns fail
      let fbQuery = supabase
        .from('assessments')
        .select('id, course_id, title, max_score, assessment_date, created_by, created_at', { count: 'exact' })
      if (courseId) {
        fbQuery = fbQuery.eq('course_id', courseId)
      }
      const fbResult = await fbQuery
        .order('assessment_date', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1)

      const records = fbResult.data ?? []
      totalCount = fbResult.count ?? records.length

      const courseIds = Array.from(new Set(records.map((r: any) => r.course_id).filter(Boolean)))
      const userIds = Array.from(new Set(records.map((r: any) => r.created_by).filter(Boolean)))
      let courseMap = new Map<string, string>()
      let profileMap = new Map<string, { id: string; fullName: string; role: string }>()

      if (courseIds.length > 0) {
        const { data: cData } = await supabase.from('courses').select('id, name').in('id', courseIds)
        if (cData) courseMap = new Map(cData.map((c: any) => [c.id, c.name]))
      }
      if (userIds.length > 0) {
        const { data: pData } = await supabase.from('profiles').select('id, full_name, role').in('id', userIds)
        if (pData) {
          profileMap = new Map(
            pData.map((p: any) => [
              p.id,
              { id: String(p.id), fullName: String(p.full_name || ''), role: String(p.role || 'staff') },
            ]),
          )
        }
      }

      formattedData = records.map((record: any) => ({
        id: record.id,
        courseId: record.course_id,
        courseName: courseMap.get(String(record.course_id)) ?? '',
        title: record.title,
        maxScore: record.max_score,
        assessmentDate: record.assessment_date,
        formUrl: null,
        sheetUrl: null,
        createdBy: profileMap.get(String(record.created_by)) ?? null,
        createdAt: record.created_at,
      }))
    }

    return NextResponse.json({
      data: formattedData,
      count: formattedData.length,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      hasMore: pagination.offset + pagination.limit < totalCount,
    })
  } catch (error) {
    return unexpectedApiError(error, 'Unable to load assessments')
  }
}

async function postAssessment(req: NextRequest) {
  const rejected = validateMutationRequest(req)
  if (rejected) return rejected
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Get the current user's profile to get their ID and role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  if (profileError || !profile) {
    return unexpectedApiError(
      profileError ?? new Error('User profile was not found.'),
      'Unable to fetch assessment creator profile',
    )
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = assessmentSchema.parse(body)

    const { courseId, title, maxScore, assessmentDate, formUrl, sheetUrl } = parsedBody

    // Business logic validations
    // 1. Check if course exists
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .single()

    if (courseError?.code === 'PGRST116' || (!courseError && !courseData)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (courseError) return unexpectedApiError(courseError, 'Unable to load assessment course')

    // 2. Check if user has permission to create assessments for this course
    // For now, allow staff, admin, and all trainers (as noted in migration)
    // TODO: Update this once course-assignment concept exists
    const hasPermission = profile.role === 'admin' || profile.role === 'staff'

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to create assessment' }, { status: 403 })
    }

    // Insert assessment record
    const assessmentData: Record<string, any> = {
      course_id: courseId,
      title,
      max_score: maxScore,
      assessment_date: assessmentDate,
      created_by: session.user.id,
    }
    if (formUrl) assessmentData.form_url = formUrl
    if (sheetUrl) assessmentData.sheet_url = sheetUrl

    const { data: inserted, error: assessmentError } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single()

    if (assessmentError) throw assessmentError
    const assessmentRecord = inserted

    // Format response
    const formattedRecord = {
      id: assessmentRecord.id,
      courseId: assessmentRecord.course_id,
      courseName: courseData.name,
      title: assessmentRecord.title,
      maxScore: assessmentRecord.max_score,
      assessmentDate: assessmentRecord.assessment_date,
      formUrl: assessmentRecord.form_url ?? formUrl ?? null,
      sheetUrl: assessmentRecord.sheet_url ?? sheetUrl ?? null,
      createdBy: {
        id: assessmentRecord.created_by,
        fullName: profile.full_name,
        role: profile.role,
      },
      createdAt: assessmentRecord.created_at,
    }

    return NextResponse.json(
      {
        data: formattedRecord,
        message: 'Assessment created successfully',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Unable to create assessment')
  }
}

export const GET = withApi({ roles: rolesFor('assessments', 'read') }, async ({ request }) =>
  getAssessments(request as NextRequest),
)
export const POST = withApi({ roles: rolesFor('assessments', 'create') }, async ({ request }) =>
  postAssessment(request as NextRequest),
)
