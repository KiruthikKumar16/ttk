import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attendanceSchema } from '@/lib/validation'
import { unexpectedApiError } from '@/lib/api-response'
import { normalizeJoined } from '@/lib/supabase/relations'
import z from 'zod'

export async function GET(req: NextRequest) {
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50
    const from = (page - 1) * pageSize
    const to = page * pageSize - 1

    let query = supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        course_id,
        session_date,
        status,
        marked_by,
        created_at,
        students!attendance_student_id_fkey (register_id, name),
        courses!attendance_course_id_fkey (id, name),
        profiles!attendance_marked_by_fkey (id, full_name, role)
      `, { count: 'exact' })

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', parseInt(studentId, 10))
    }
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    if (startDate) {
      query = query.gte('session_date', startDate)
    }
    if (endDate) {
      query = query.lte('session_date', endDate)
    }

    const { data, error, count } = await query
      .order('session_date', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Format the response for easier consumption
    const formattedData = (data || []).map(record => {
      const student = normalizeJoined(record.students)
      const course = normalizeJoined(record.courses)
      const profile = normalizeJoined(record.profiles)
      return {
        id: record.id,
        studentId: student?.register_id,
        studentName: student?.name,
        courseId: course?.id,
        courseName: course?.name,
        sessionDate: record.session_date,
        status: record.status,
        markedBy: profile ? {
          id: profile.id,
          fullName: profile.full_name,
          role: profile.role
        } : null,
        createdAt: record.created_at
      }
    })

    return NextResponse.json({
      data: formattedData,
      count: data?.length || 0,
      page,
      pageSize,
      totalCount: count || 0
    })
  } catch (error) {
    return unexpectedApiError(error, 'Unable to load attendance')
  }
}

export async function POST(req: NextRequest) {
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    return unexpectedApiError(profileError ?? new Error('User profile was not found.'), 'Unable to fetch attendance creator profile')
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = attendanceSchema.parse(body)

    const { studentId, courseId, sessionDate, status, markedBy } = parsedBody

    // Use the authenticated user's ID for markedBy if not provided
    const finalMarkedBy = markedBy ?? session.user.id

    // Business logic validations
    // 1. Check if student exists
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, register_id, name')
      .eq('register_id', studentId)
      .single()

    if (studentError?.code === 'PGRST116' || (!studentError && !studentData)) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (studentError) return unexpectedApiError(studentError, 'Unable to load attendance student')

    // 2. Check if course exists
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .single()

    if (courseError?.code === 'PGRST116' || (!courseError && !courseData)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (courseError) return unexpectedApiError(courseError, 'Unable to load attendance course')

    // 3. Check if user has permission to mark attendance for this course
    // For now, allow staff, admin, and all trainers (as noted in migration)
    // TODO: Update this once course-assignment concept exists
    const hasPermission =
      profile.role === 'admin' ||
      profile.role === 'staff' ||
      profile.role === 'trainer'

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to mark attendance' }, { status: 403 })
    }

    // Upsert attendance record (insert or update on conflict)
    const attendanceData = {
      student_id: studentData.id,
      course_id: courseId,
      session_date: sessionDate,
      status,
      marked_by: finalMarkedBy
    }

    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'student_id,course_id,session_date',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (attendanceError) throw attendanceError

    // Format response
    const formattedRecord = {
      id: attendanceRecord.id,
      studentId: studentData.register_id,
      studentName: studentData.name,
      courseId: courseData.id,
      courseName: courseData.name,
      sessionDate: attendanceRecord.session_date,
      status: attendanceRecord.status,
      markedBy: {
        id: attendanceRecord.marked_by,
        fullName: profile.full_name,
        role: profile.role
      },
      createdAt: attendanceRecord.created_at
    }

    return NextResponse.json({
      data: formattedRecord,
      message: 'Attendance marked successfully'
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Unable to mark attendance')
  }
}
