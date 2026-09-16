import { NextResponse } from 'next/server'
import { listStudents } from '@/lib/server-data'
import { supabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    const data = await listStudents()
    return NextResponse.json({ data, count: data.length, source: supabase ? 'supabase' : 'mock' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load students' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const course = String(body.course ?? 'Professional Course').trim()
    const batch = String(body.batch ?? new Date().toISOString().slice(0, 10)).trim()
    const total = Number(body.total)
    const paid = Number(body.paid ?? 0)
    if (!name || !phone || !Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid < 0 || paid > total) {
      return NextResponse.json({ error: 'Valid name, phone, total fees, and initial payment are required.' }, { status: 400 })
    }

    const registerId = Number(body.registerId ?? Date.now())
    const student = { registerId, name, phone, course, batch, total, paid, status: paid >= total ? 'Fully Paid' : 'Pending' as const }
    if (supabase) {
      const { data, error } = await supabase.from('students').insert({ register_id: registerId, name, phone, course, batch, total, paid, status: student.status }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ message: 'Student created successfully', data: studentFromApiRow(data), source: 'supabase' }, { status: 201 })
    }
    return NextResponse.json({ message: 'Student created successfully', data: student, source: 'mock' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create student' }, { status: 500 })
  }
}

function studentFromApiRow(row: Record<string, unknown>) {
  const total = Number(row.total ?? 0)
  const paid = Number(row.paid ?? 0)
  return { registerId: Number(row.register_id), name: String(row.name), phone: String(row.phone ?? ''), course: String(row.course), batch: String(row.batch), total, paid, status: paid >= total ? 'Fully Paid' : 'Pending' }
}
