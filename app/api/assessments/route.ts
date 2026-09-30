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

    const { data, error, count } = await query
      .order('assessment_date', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)

    if (error) throw error

    // Format the response for easier consumption
    const formattedData = (data || []).map((record) => {
      const course = normalizeJoined(record.courses)
      const profile = normalizeJoined(record.profiles)
      return {
        id: record.id,
        courseId: record.course_id,
        courseName: course?.name,
        title: record.title,
        maxScore: record.max_score,
        assessmentDate: record.assessment_date,
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

    return NextResponse.json({
      data: formattedData,
      count: data?.length || 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: count || 0,
      hasMore: pagination.offset + pagination.limit < (count || 0),
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

    const { courseId, title, maxScore, assessmentDate } = parsedBody

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
    const assessmentData = {
      course_id: courseId,
      title,
      max_score: maxScore,
      assessment_date: assessmentDate,
      created_by: session.user.id,
    }

    const { data: assessmentRecord, error: assessmentError } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single()

    if (assessmentError) throw assessmentError

    // Format response
    const formattedRecord = {
      id: assessmentRecord.id,
      courseId: assessmentRecord.course_id,
      courseName: courseData.name,
      title: assessmentRecord.title,
      maxScore: assessmentRecord.max_score,
      assessmentDate: assessmentRecord.assessment_date,
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
