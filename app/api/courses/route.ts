import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { Course } from '@/lib/types'
import { courseSchema } from '@/lib/validation'
import z from 'zod'

export async function GET(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const { data, error } = await supabase.from('courses').select('*').order('name')
    if (error) throw error
    if (!data || data.length === 0) {
      // Fallback to mock data if no data in supabase
      const { initialCourses } = require('@/lib/mock-data')
      return NextResponse.json({ data: initialCourses, source: 'mock' })
    }
    return NextResponse.json({
      data: data.map((c) => ({
        id: c.id,
        name: c.name,
        fee: Number(c.fee),
        duration: c.duration,
        description: c.description,
        gstInclusive: Boolean(c.gst_inclusive ?? c.gstInclusive ?? false),
      })),
      source: 'supabase',
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save course' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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

    // Also remove from mock data for consistency
    const { initialCourses } = require('@/lib/mock-data')
    const idx = initialCourses.findIndex(c => c.id === id)
    if (idx >= 0) {
      initialCourses.splice(idx, 1)
    }

    return NextResponse.json({ success: true, message: 'Course deleted' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete course' }, { status: 500 })
  }
}