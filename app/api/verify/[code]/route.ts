import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getVerificationSelector, type PublicVerificationResult } from '@/lib/verification'
import { unexpectedApiError } from '@/lib/api-response'

// GET /api/verify/[code] - Public verification endpoint for documents
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  // Validate input
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return NextResponse.json(
      { error: 'Verification code is required' },
      { status: 400 }
    )
  }

  try {
    // Public by design: validate the code and active state before selecting minimal public fields.
    // This privileged lookup intentionally bypasses RLS; no authenticated user data is returned.
    const supabase = getSupabaseAdminClient()

    // Look up the verification code
    const { data: docRow, error } = await supabase
      .from('verifiable_documents')
      .select(
        'id, doc_type, reference_id, verification_code, status, issued_at, revoked_at'
      )
      .eq('verification_code', code.trim())
      .single()

    if (error?.code === 'PGRST116' || (!error && !docRow)) {
      // Do not leak whether the code almost matched something
      return NextResponse.json(
        { status: 'Invalid' },
        { status: 200 } // Return 200 with Invalid status to avoid leaking info
      )
    }
    if (error) throw error

    // Check if the document is revoked
    if (docRow.status === 'revoked' || docRow.revoked_at !== null) {
      return NextResponse.json(
        { status: 'Invalid' },
        { status: 200 }
      )
    }

    // If we get here, the document is active
    // Now we need to fetch the referenced document (certificate or payment) to get public fields
    let publicResult: PublicVerificationResult = { status: 'Invalid' }

    if (docRow.doc_type === 'certificate') {
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .select('student_name, course_name, issue_date')
        .eq('id', docRow.reference_id)
        .maybeSingle()
      if (certError) throw certError
      if (certData) {
        const selector = getVerificationSelector('certificate')
        if (selector) publicResult = selector(certData)
      }
    } else if (docRow.doc_type === 'invoice') {
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('invoice, amount, gst_rate, payment_date')
        .eq('id', docRow.reference_id)
        .maybeSingle()
      if (paymentError) throw paymentError
      if (paymentData) {
        const selector = getVerificationSelector('invoice')
        if (selector) publicResult = selector(paymentData)
      }
    }

    return NextResponse.json({ data: publicResult }, { status: 200 })
  } catch (error) {
    return unexpectedApiError(error, 'Verification lookup failed')
  }
}
