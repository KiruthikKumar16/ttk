import { NextResponse } from 'next/server'
import { initialCourses } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase/server'
import type { Course } from '@/lib/types'

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('courses').select('*').order('name')
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          data: data.map((c: any) => ({
            id: c.id,
            name: c.name,
            fee: Number(c.fee),
            duration: c.duration,
            description: c.description,
          })),
          source: 'supabase',
        })
      }
    }
    return NextResponse.json({ data: initialCourses, source: 'mock' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const fee = Number(body.fee)
    const duration = String(body.duration ?? '3 Months').trim()
    const description = String(body.description ?? '').trim()

    if (!name || isNaN(fee) || fee < 0) {
      return NextResponse.json({ error: 'Valid course name and fee are required.' }, { status: 400 })
    }

    const id = body.id || `CRS-${String(Date.now()).slice(-4)}`
    const newCourse: Course = { id, name, fee, duration, description }

    if (supabase) {
      const { data, error } = await supabase.from('courses').insert({
        id,
        name,
        fee,
        duration,
        description
      }).select().single()
      if (!error && data) {
        return NextResponse.json({ data: { ...data, fee: Number(data.fee) }, message: 'Course created' }, { status: 201 })
      }
    }

    // Update in-memory
    const existingIndex = initialCourses.findIndex(c => c.id === id || c.name.toLowerCase() === name.toLowerCase())
    if (existingIndex >= 0) {
      initialCourses[existingIndex] = newCourse
    } else {
      initialCourses.push(newCourse)
    }

    return NextResponse.json({ data: newCourse, message: 'Course saved' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save course' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 })

    if (supabase) {
      await supabase.from('courses').delete().eq('id', id)
    }

    const idx = initialCourses.findIndex(c => c.id === id)
    if (idx >= 0) {
      initialCourses.splice(idx, 1)
    }

    return NextResponse.json({ success: true, message: 'Course deleted' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete course' }, { status: 500 })
  }
}
