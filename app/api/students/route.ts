import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listStudents, studentFromRow } from '@/lib/server-data'
import { studentSchema } from '@/lib/validation'
import z from 'zod'
import { unexpectedApiError } from '@/lib/api-response'
import { pagePaginationFromSearchParams } from '@/lib/pagination'
import { calculateGstForRupees, rupeesToPaise, paiseToRupees } from '@/lib/money'

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
    const pagination = pagePaginationFromSearchParams(searchParams)

    const result = await listStudents(supabase, { page: pagination.page, pageSize: pagination.pageSize })
    return NextResponse.json(result)
  } catch (error) {
    return unexpectedApiError(error, 'Unable to load students')
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
    const parsedBody = studentSchema.parse(body)

    const {
      name,
      phone,
      course,
      batch,
      total,
      paid,
      gender,
      dob,
      altPhone,
      maritalStatus,
      email,
      country,
      state,
      city,
      area,
      studentSource,
      comments,
      knowledgeTags,
    } = parsedBody

    // Business-logic validation: paid cannot exceed total
    if (rupeesToPaise(paid) > rupeesToPaise(total)) {
      return NextResponse.json({ error: 'Paid amount cannot exceed total fees' }, { status: 400 })
    }

    const studentData = {
      name,
      phone,
      course,
      batch,
      total: rupeesToPaise(total),
      // The payment trigger applies any initial payment exactly once.
      paid: rupeesToPaise(0),
      status: (paid >= total ? 'Fully Paid' : 'Pending') as 'Fully Paid' | 'Pending',
      gender: gender ?? null,
      dob: dob ?? null,
      alt_phone: altPhone ?? null,
      marital_status: maritalStatus ?? null,
      email: email ?? null,
      country: country ?? null,
      state: state ?? null,
      city: city ?? null,
      area: area ?? null,
      lead_source: studentSource ?? null,
      comments: comments ?? null,
      knowledge_tags: knowledgeTags ?? [],
    }

    let createdPayment = null
    const paymentDate = new Date().toISOString().slice(0, 10)

    // Insert student without register_id (let DB generate via sequence)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single()
      if (studentError) return unexpectedApiError(studentError, 'Unable to insert student')

      // If there's an initial payment, create it
      if (paid > 0) {
        const initialGstRate = 18
        const initialGst = calculateGstForRupees(paid, initialGstRate, false)

        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            student_id: student.id,
            student_register_id: student.register_id,
            method: 'Initial Payment',
            amount: rupeesToPaise(paid),
            payment_date: paymentDate,
            gst_rate: initialGstRate,
            cgst: rupeesToPaise(initialGst.cgstAmount),
            sgst: rupeesToPaise(initialGst.sgstAmount),
          })
          .select()
          .single()
        if (paymentError) return unexpectedApiError(paymentError, 'Unable to record initial payment')

        // Format the date for display
        const dateStr = new Date(paymentDate + 'T00:00:00').toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })

        createdPayment = {
          ...paymentData,
          student: name,
          method: 'Initial Payment',
          date: dateStr,
          amount: paid,
          invoice: paymentData.invoice,
          studentId: student.register_id,
          studentRowId: student.id,
          cgst: paiseToRupees(Number(paymentData.cgst)),
          sgst: paiseToRupees(Number(paymentData.sgst)),
          gstRate: paymentData.gst_rate,
          transactionId: paymentData.transaction_id,
          customNote: paymentData.custom_note,
        }
      }

      return NextResponse.json({
        message: 'Student created successfully',
        data: studentFromRow({
          ...student,
          paid: rupeesToPaise(paid),
          status: paid >= total ? 'Fully Paid' : 'Pending',
        }),
        payment: createdPayment,
      }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Unable to create student')
  }
}
