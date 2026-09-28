import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listPayments } from '@/lib/server-data'
import { paymentSchema } from '@/lib/validation'
import { generateUniqueVerificationCode } from '@/lib/utils'
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
    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50

    const result = await listPayments(supabase, { page, pageSize })
    return NextResponse.json(result)
  } catch (error) {
    return unexpectedApiError(error, 'Unable to load payments')
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

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = paymentSchema.parse(body)

    const {
      studentId,
      amount,
      method,
      date,
      transactionId,
      customNote,
      gstRate,
      cgst,
      sgst,
    } = parsedBody

    // Business-logic validation will be done after fetching the student (checking balance)

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('register_id', studentId)
      .single()
    if (studentError?.code === 'PGRST116' || (!studentError && !student)) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
    }
    if (studentError) return unexpectedApiError(studentError, 'Unable to load payment student')

    const balance = Number(student.total) - Number(student.paid)
    if (amount > balance) {
      return NextResponse.json({ error: `Payment exceeds the remaining balance of ${balance}.` }, { status: 400 })
    }

    const paymentDate = date ?? new Date().toISOString().slice(0, 10)

    const paymentRow: Record<string, unknown> = {
      student_id: student.id,
      student_register_id: studentId,
      method,
      amount,
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
    if (paymentError) return unexpectedApiError(paymentError, 'Unable to record payment')

    const paid = Number(student.paid) + amount
    const { error: updateError } = await supabase
      .from('students')
      .update({ paid, status: paid >= Number(student.total) ? 'Fully Paid' : 'Pending', updated_at: new Date().toISOString() })
      .eq('id', student.id)
    if (updateError) return unexpectedApiError(updateError, 'Unable to update student balance')

    const dateStr = new Date(paymentDate + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    // Create a verification record for the invoice.
    try {
      const verificationCode = await generateUniqueVerificationCode(supabase)
      const { error: verificationError } = await supabase
        .from('verifiable_documents')
        .insert({
          doc_type: 'invoice',
          reference_id: payment.id,
          verification_code: verificationCode,
          status: 'active',
        })
      if (verificationError) throw verificationError
    } catch (verificationError) {
      console.error('Failed to create verifiable document entry for invoice:', verificationError)
      throw verificationError
    }

    return NextResponse.json(
      {
        data: {
          id: payment.id,
          student: student.name,
          method,
          date: dateStr,
          amount: Number(payment.amount),
          invoice: payment.invoice,
          studentId: studentId,
          studentRowId: student.id,
          cgst: Number(payment.cgst) ?? 0,
          sgst: Number(payment.sgst) ?? 0,
          transactionId: payment.transaction_id,
          customNote: payment.custom_note,
          gstRate: Number(payment.gst_rate) ?? 0,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Unable to record payment')
  }
}
