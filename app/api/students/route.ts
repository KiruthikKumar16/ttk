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
    
    let createdPayment = null
    const next = Date.now()
    const paymentId = `RCPT-${next}`
    const invoice = `TAI/${new Date().getFullYear()}/INV${String(next).slice(-6)}`
    const paymentDate = new Date().toISOString().slice(0, 10)

    if (supabase) {
      const { data, error } = await supabase.from('students').insert({ register_id: registerId, name, phone, course, batch, total, paid, status: student.status }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      if (paid > 0) {
        const { data: pData } = await supabase.from('payments').insert({
          id: paymentId,
          student_id: data.id,
          student_register_id: registerId,
          method: 'Initial Payment',
          amount: paid,
          invoice,
          payment_date: paymentDate
        }).select().single()

        if (pData) {
          createdPayment = { ...pData, student: name, studentId: registerId, date: paymentDate, amount: paid, invoice }
        }
      }

      return NextResponse.json({ message: 'Student created successfully', data: studentFromApiRow(data), payment: createdPayment, source: 'supabase' }, { status: 201 })
    }
    
    // In-memory mock data mutation
    const { initialStudents, initialPayments } = require('@/lib/mock-data');
    initialStudents.unshift(student);

    if (paid > 0) {
      createdPayment = {
        id: paymentId,
        student: name,
        method: 'Initial Payment',
        date: paymentDate,
        amount: paid,
        invoice,
        studentId: registerId,
      }
      initialPayments.unshift(createdPayment)
    }
    
    return NextResponse.json({ message: 'Student created successfully', data: student, payment: createdPayment, source: 'mock' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create student' }, { status: 500 })
  }
}

function studentFromApiRow(row: Record<string, unknown>) {
  const total = Number(row.total ?? 0)
  const paid = Number(row.paid ?? 0)
  return { registerId: Number(row.register_id), name: String(row.name), phone: String(row.phone ?? ''), course: String(row.course), batch: String(row.batch), total, paid, status: paid >= total ? 'Fully Paid' : 'Pending' }
}
