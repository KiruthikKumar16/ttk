import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { assessmentResultSchema } from '@/lib/validation'
import z from 'zod'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { id: assessmentId } = await params

  try {
    // First, check if the assessment exists and user has permission to view it
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, course_id, title, max_score')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessmentData) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Check if user has permission to view results for this assessment
    // For now, allow staff, admin, and all trainers (as noted in migration)
    // TODO: Update this once course-assignment concept exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData) {
      return new NextResponse(JSON.stringify({ error: 'Unable to fetch user profile' }), { status: 400 })
    }

    const hasPermission =
      profileData.role === 'admin' ||
      profileData.role === 'staff' ||
      profileData.role === 'trainer'

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to view assessment results' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50
    const from = (page - 1) * pageSize
    const to = page * pageSize - 1

    let query = supabase
      .from('assessment_results')
      .select(`
        id,
        assessment_id,
        student_id,
        score,
        remarks,
        graded_by,
        graded_at,
        students!assessment_results_student_id_fkey (id, register_id, name, course),
        profiles!assessment_results_graded_by_fkey (id, full_name, role)
      `, { count: 'exact' })
      .eq('assessment_id', assessmentId)

    const { data, error, count } = await query
      .order('graded_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Format the response for easier consumption
    const formattedData = (data || []).map(record => ({
      id: record.id,
      studentId: record.students?.register_id,
      studentName: record.students?.name,
      score: record.score,
      remarks: record.remarks,
      gradedBy: record.profiles ? {
        id: record.profiles.id,
        fullName: record.profiles.full_name,
        role: record.profiles.role
      } : null,
      gradedAt: record.graded_at
    }))

    return NextResponse.json({
      data: formattedData,
      count: data?.length || 0,
      page,
      pageSize,
      totalCount: count || 0
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load assessment results' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { id: assessmentId } = await params

  // Get the current user's profile to get their ID and role
  let profile = null
  if (supabase) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData) {
      return new NextResponse(JSON.stringify({ error: 'Unable to fetch user profile' }), { status: 400 })
    }
    profile = profileData
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = assessmentResultSchema.parse(body)

    const { studentId, score, remarks } = parsedBody

    // Business logic validations
    // 1. Check if assessment exists
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, max_score')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessmentData) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // 2. Check if student exists
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, register_id, name')
      .eq('register_id', studentId)
      .single()

    if (studentError || !studentData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 3. Check if user has permission to create results for this assessment
    // For now, allow staff, admin, and all trainers (as noted in migration)
    // TODO: Update this once course-assignment concept exists
    const hasPermission =
      profile.role === 'admin' ||
      profile.role === 'staff' ||
      profile.role === 'trainer'

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to create assessment result' }, { status: 403 })
    }

    // 4. Check if score <= max_score (this will also be checked by the trigger, but we can do it early for better UX)
    if (score > assessmentData.max_score) {
      return NextResponse.json({ error: `Score cannot exceed the maximum score of ${assessmentData.max_score}` }, { status: 400 })
    }

    // 5. Check if a result already exists for this student and assessment (to avoid duplicate key error)
    const { data: existingResult, error: checkError } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentData.id)
      .single()

    // If there's an existing result, we'll update it instead of inserting a new one
    // But note: the unique constraint is on (assessment_id, student_id), so we can use upsert
    // However, we want to update the graded_by and graded_at as well.
    // We'll use upsert with on conflict to update the existing record.

    const resultData = {
      assessment_id: assessmentId,
      student_id: studentData.id,
      score,
      remarks: remarks ?? null,
      graded_by: session.user.id
    }

    const { data: resultRecord, error: resultError } = await supabase
      .from('assessment_results')
      .upsert(resultData, {
        onConflict: ['assessment_id', 'student_id'],
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (resultError) throw resultError

    // Format response
    const formattedRecord = {
      id: resultRecord.id,
      studentId: studentData.register_id,
      studentName: studentData.name,
      score: resultRecord.score,
      remarks: resultRecord.remarks,
      gradedBy: {
        id: resultRecord.graded_by,
        fullName: profile.full_name,
        role: profile.role
      },
      gradedAt: resultRecord.graded_at
    }

    return NextResponse.json({
      data: formattedRecord,
      message: 'Assessment result saved successfully'
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save assessment result' }, { status: 500 })
  }
}
