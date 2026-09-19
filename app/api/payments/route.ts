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
    const paymentDate = String(body.date ?? new Date().toISOString().slice(0, 10))
    const transactionId = body.transactionId ? String(body.transactionId).trim() || undefined : undefined
    const customNote = body.customNote ? String(body.customNote).trim() || undefined : undefined
    const invoiceFromBody = body.invoice ? String(body.invoice).trim() : null
    const idFromBody = body.id ? String(body.id).trim() : null
    const gstRate = Number(body.gstRate ?? 18)

    if (!Number.isFinite(studentRegisterId) || !Number.isFinite(amount) || amount <= 0 || !method) {
      return NextResponse.json({ error: 'Student, payment amount, and method are required.' }, { status: 400 })
    }

    const next = Date.now()
    const id = idFromBody || `RCPT-${next}`
    const invoice = invoiceFromBody || `TAI/${new Date().getFullYear()}/INV${String(next).slice(-6)}`

    const taxableValue = Number(body.taxableValue) ? Number(body.taxableValue) : amount
    const cgstRaw = Number(body.cgst)
    const sgstRaw = Number(body.sgst)
    let cgst: number
    let sgst: number
    if (Number.isFinite(cgstRaw) && Number.isFinite(sgstRaw) && (cgstRaw > 0 || sgstRaw > 0)) {
      cgst = cgstRaw
      sgst = sgstRaw
    } else if (gstRate > 0 && body.gstInclusive !== true) {
      const gst = Math.round(taxableValue * (gstRate / 100))
      cgst = Math.round(gst / 2)
      sgst = gst - cgst
    } else {
      cgst = 0
      sgst = 0
    }

    if (!supabase) {
      const { initialStudents, initialPayments } = require('@/lib/mock-data')
      const student = initialStudents.find((s: any) => s.registerId === studentRegisterId)
      if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
      const balance = Number(student.total) - Number(student.paid)
      if (amount > balance) return NextResponse.json({ error: `Payment exceeds the remaining balance of ${balance}.` }, { status: 400 })

      student.paid = Number(student.paid) + amount
      student.status = student.paid >= Number(student.total) ? 'Fully Paid' : 'Pending'

      const dateStr = new Date(paymentDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })

      const newPayment: any = {
        id,
        student: student.name,
        method,
        date: dateStr,
        amount,
        invoice,
        studentId: studentRegisterId,
      }
      if (cgst > 0) newPayment.cgst = cgst
      if (sgst > 0) newPayment.sgst = sgst
      if (transactionId) newPayment.transactionId = transactionId
      if (customNote) newPayment.customNote = customNote
      if (gstRate > 0) newPayment.gstRate = gstRate
      initialPayments.unshift(newPayment)

      return NextResponse.json({ data: newPayment, source: 'mock' }, { status: 201 })
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('register_id', studentRegisterId)
      .single()
    if (studentError || !student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })

    const balance = Number(student.total) - Number(student.paid)
    if (amount > balance) {
      return NextResponse.json({ error: `Payment exceeds the remaining balance of ${balance}.` }, { status: 400 })
    }

    const paymentRow: Record<string, unknown> = {
      id,
      student_id: student.id,
      student_register_id: studentRegisterId,
      method,
      amount,
      invoice,
      payment_date: paymentDate,
      transaction_id: transactionId ?? null,
      custom_note: customNote ?? null,
      gst_rate: gstRate,
      cgst,
      sgst,
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRow)
      .select()
      .single()
    if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 })

    const paid = Number(student.paid) + amount
    const { error: updateError } = await supabase
      .from('students')
      .update({ paid, status: paid >= Number(student.total) ? 'Fully Paid' : 'Pending', updated_at: new Date().toISOString() })
      .eq('id', student.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    const dateStr = new Date(paymentDate + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    return NextResponse.json(
      {
        data: {
          id,
          student: student.name,
          method,
          date: dateStr,
          amount,
          invoice,
          studentId: studentRegisterId,
          studentRowId: student.id,
          cgst,
          sgst,
          transactionId,
          customNote,
          gstRate,
        },
        source: 'supabase',
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record payment' }, { status: 500 })
  }
}
