import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getVerificationSelector, type PublicVerificationResult } from '@/lib/verification'

// GET /api/verify/[code] - Public verification endpoint for documents
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params

  // Validate input
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return NextResponse.json(
      { error: 'Verification code is required' },
      { status: 400 }
    )
  }

  try {
    // Use admin/service role client to bypass RLS for lookup
    const supabase = getSupabaseAdminClient()

    // Look up the verification code
    const { data: docRow, error, count } = await supabase
      .from('verifiable_documents')
      .select(
        'id, doc_type, reference_id, verification_code, status, issued_at, revoked_at'
      )
      .eq('verification_code', code.trim())
      .single()

    // Handle case where verification code is not found or other errors
    if (error || !docRow) {
      // Do not leak whether the code almost matched something
      return NextResponse.json(
        { status: 'Invalid' },
        { status: 200 } // Return 200 with Invalid status to avoid leaking info
      )
    }

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

    try {
      // Fetch the referenced document based on doc_type
      if (docRow.doc_type === 'certificate') {
        // Fetch certificate by reference_id, selecting only the fields we need
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('student_name, course_name, issue_date')
          .eq('id', docRow.reference_id)
          .single()

        if (!certError && certData) {
          const selector = getVerificationSelector('certificate')
          if (selector) {
            publicResult = selector(certData)
          }
        }
      } else if (docRow.doc_type === 'invoice') {
        // For invoice, we look up the payment by reference_id
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('invoice, amount, gst_rate, payment_date')
          .eq('id', docRow.reference_id)
          .single()

        if (!paymentError && paymentData) {
          const selector = getVerificationSelector('invoice')
          if (selector) {
            publicResult = selector(paymentData)
          }
        }
      }
      // Note: If doc_type is unknown or fetch fails, we fall back to Invalid
    } catch (fetchError) {
      // Log the error but don't expose details
      console.error('Error fetching referenced document for verification:', fetchError)
      // Keep publicResult as Invalid
    }

    return NextResponse.json({ data: publicResult }, { status: 200 })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { status: 'Invalid' },
      { status: 200 }
    )
  }
}