import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { listStudents, studentFromRow } from '@/lib/server-data'
import { studentSchema } from '@/lib/validation'
import { brand } from '@/lib/brand'
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
    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50

    const result = await listStudents(supabase, { page, pageSize })
    // Add source for consistency with previous responses
    return NextResponse.json({ ...result, source: 'supabase' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load students' }, { status: 400 })
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
    if (paid > total) {
      return NextResponse.json({ error: 'Paid amount cannot exceed total fees' }, { status: 400 })
    }

    const studentData = {
      name,
      phone,
      course,
      batch,
      total,
      paid,
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

    if (supabase) {
      // Insert student without register_id (let DB generate via sequence)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single()
      if (studentError) return NextResponse.json({ error: studentError.message }, { status: 400 })

      // If there's an initial payment, create it
      if (paid > 0) {
        const initialGstRate = 18
        const initialCgst = Math.round((paid * (initialGstRate / 100)) / 2)
        const initialSgst = Math.round((paid * (initialGstRate / 100)) / 2)

        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            student_id: student.id,
            student_register_id: student.register_id,
            method: 'Initial Payment',
            amount: paid,
            payment_date: paymentDate,
            gst_rate: initialGstRate,
            cgst: initialCgst,
            sgst: initialSgst,
          })
          .select()
          .single()
        if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 })

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
          cgst: paymentData.cgst,
          sgst: paymentData.sgst,
          gstRate: paymentData.gst_rate,
          transactionId: paymentData.transaction_id,
          customNote: paymentData.custom_note,
        }
      }

      return NextResponse.json({
        message: 'Student created successfully',
        data: studentFromRow(student),
        payment: createdPayment,
        source: 'supabase'
      }, { status: 201 })
    }

    // In-memory mock data mutation (fallback when supabase is not available)
    const { initialStudents, initialPayments } = require('@/lib/mock-data');
    // For mock, we still generate IDs client-side (since no sequences in mock)
    const next = Date.now()
    const registerId = next  // Using timestamp for mock simplicity
    const paymentId = `RCPT-${next}`
    const invoice = `${brand.invoicePrefix}/${new Date().getFullYear()}/INV${String(next).slice(-6)}`

    const mockStudent = {
      registerId,
      name,
      phone,
      course,
      batch,
      total,
      paid,
      status: (paid >= total ? 'Fully Paid' : 'Pending') as 'Fully Paid' | 'Pending',
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
    }

    if (paid > 0) {
      const createdPaymentMock = {
        id: paymentId,
        student: name,
        method: 'Initial Payment',
        date: paymentDate,
        amount: paid,
        invoice,
        studentId: registerId,
      }
      initialPayments.unshift(createdPaymentMock)
    }

    initialStudents.unshift(mockStudent)

    return NextResponse.json({
      message: 'Student created successfully',
      data: mockStudent,
      payment: paid > 0 ? {
        id: `RCPT-${Date.now()}`,
        student: name,
        method: 'Initial Payment',
        date: paymentDate,
        amount: paid,
        invoice: `${brand.invoicePrefix}/${new Date().getFullYear()}/INV${String(Date.now()).slice(-6)}`,
        studentId: next,
      } : null,
      source: 'mock'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create student' }, { status: 500 })
  }
}
