import { NextResponse } from 'next/server'
import { listPayments } from '@/lib/server-data'
import { supabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    const data = await listPayments()
    return NextResponse.json({ data, count: data.length, source: supabase ? 'supabase' : 'mock' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load payments' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const studentRegisterId = Number(body.studentId)
    const amount = Number(body.amount)
    const method = String(body.method ?? '').trim()
    if (!Number.isFinite(studentRegisterId) || !Number.isFinite(amount) || amount <= 0 || !method) return NextResponse.json({ error: 'Student, payment amount, and method are required.' }, { status: 400 })

    const next = Date.now()
    const id = `RCPT-${next}`
    const invoice = `TAI/${new Date().getFullYear()}/INV${String(next).slice(-6)}`
    const paymentDate = String(body.date ?? new Date().toISOString().slice(0, 10))

    if (!supabase) {
      const { initialStudents, initialPayments } = require('@/lib/mock-data')
      const student = initialStudents.find((s: any) => s.registerId === studentRegisterId)
      if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
      const balance = Number(student.total) - Number(student.paid)
      if (amount > balance) return NextResponse.json({ error: `Payment exceeds the remaining balance of ${balance}.` }, { status: 400 })

      student.paid = Number(student.paid) + amount
      student.status = student.paid >= Number(student.total) ? 'Fully Paid' : 'Pending'

      const newPayment = {
        id,
        student: student.name,
        method,
        date: paymentDate,
        amount,
        invoice,
        studentId: studentRegisterId,
      }
      initialPayments.unshift(newPayment)

      return NextResponse.json({ data: newPayment, source: 'mock' }, { status: 201 })
    }

    const { data: student, error: studentError } = await supabase.from('students').select('*').eq('register_id', studentRegisterId).single()
    if (studentError || !student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
    const balance = Number(student.total) - Number(student.paid)
    if (amount > balance) return NextResponse.json({ error: `Payment exceeds the remaining balance of ${balance}.` }, { status: 400 })
    const { data: payment, error: paymentError } = await supabase.from('payments').insert({ id, student_id: student.id, student_register_id: studentRegisterId, method, amount, invoice, payment_date: paymentDate }).select().single()
    if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 })
    const paid = Number(student.paid) + amount
    const { error: updateError } = await supabase.from('students').update({ paid, status: paid >= Number(student.total) ? 'Fully Paid' : 'Pending', updated_at: new Date().toISOString() }).eq('id', student.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({ data: { ...payment, student: student.name, studentId: studentRegisterId, date: paymentDate, amount, invoice }, source: 'supabase' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record payment' }, { status: 500 })
  }
}
