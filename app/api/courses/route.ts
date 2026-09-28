import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Course } from '@/lib/types'
import { courseSchema } from '@/lib/validation'
import { unexpectedApiError } from '@/lib/api-response'
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
    const { data, error } = await supabase.from('courses').select('*').order('name')
    if (error) throw error
    return NextResponse.json({
      data: (data ?? []).map((course) => ({
        id: course.id,
        name: course.name,
        fee: Number(course.fee),
        duration: course.duration,
        description: course.description,
        gstInclusive: course.gst_inclusive,
      })),
    })
  } catch (error) {
    return unexpectedApiError(error, 'Failed to fetch courses')
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

  // Fetch the user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (profileError || !profile) {
    return unexpectedApiError(profileError ?? new Error('User profile was not found.'), 'Unable to fetch course creator profile')
  }

  // Only staff and admin can create courses
  if (profile.role !== 'staff' && profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to create course' }), { status: 403 })
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = courseSchema.parse(body)

    const {
      name,
      fee,
      duration,
      description,
      gstInclusive,
    } = parsedBody

    const id = body.id || `CRS-${String(Date.now()).slice(-4)}`
    const newCourse: Course = { id, name, fee, duration, description, gstInclusive }

    const { data, error } = await supabase.from('courses').insert({
      id,
      name,
      fee,
      duration,
      description,
      gst_inclusive: gstInclusive,
    }).select().single()
    if (error) throw error
    if (!data) {
      throw new Error('No data returned from insert')
    }

    return NextResponse.json({ data: { ...data, fee: Number(data.fee), gstInclusive: Boolean(data.gst_inclusive) }, message: 'Course created' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Failed to save course')
  }
}

export async function DELETE(req: NextRequest) {
  // Cookie-bound client: RLS applies to every query in this handler.
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
    return unexpectedApiError(profileError ?? new Error('User profile was not found.'), 'Unable to fetch course deleter profile')
  }

  // Only admin can delete courses
  if (profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to delete course' }), { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 })

    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true, message: 'Course deleted' })
  } catch (error) {
    return unexpectedApiError(error, 'Failed to delete course')
  }
}
