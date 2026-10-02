import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger, logProductEvent } from '@/lib/logger'
import { withApi } from '@/lib/http/handler'
import { z } from 'zod'

const invalid = {
  status: 'Invalid' as const,
  document_type: null,
  student_name: null,
  course_name: null,
  issue_date: null,
  invoice_number: null,
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function maskName(name: string | null | undefined): string | null {
  if (!name || !name.trim()) return null
  return `${name.trim().charAt(0)}…`
}

async function verifyDocument(requestId: string, rawCode: string) {
  const headers = {
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow',
    'x-request-id': requestId,
  }

  const code = decodeURIComponent(rawCode)
    .trim()
    .replace(/^['"]|['"]$/g, '')
  if (!code || code.length > 128) {
    return NextResponse.json({ data: invalid }, { headers })
  }

  // 1. Primary: execute public_verify_document RPC
  try {
    const supabase = await createClient(requestId)
    const { data, error } = await supabase.rpc('public_verify_document', { p_code: code })
    if (!error && data?.[0]?.status === 'Valid') {
      logProductEvent('verification_hit', requestId, { valid: true })
      return NextResponse.json({ data: data[0] }, { headers })
    }
  } catch (rpcErr) {
    logger.warn({ requestId, err: rpcErr }, 'RPC public_verify_document error, checking admin fallback')
  }

  // 2. Secondary fallback: direct lookup via admin client (handles non-UUID references & direct IDs)
  try {
    const admin = getSupabaseAdminClient(requestId)

    // A. Check verifiable_documents table by verification_code or reference_id
    const { data: vDocs } = await admin
      .from('verifiable_documents')
      .select('*')
      .or(`verification_code.ilike.${code},reference_id.ilike.${code}`)
      .eq('status', 'active')
      .is('revoked_at', null)
      .limit(1)

    const vDoc = vDocs?.[0]

    if (vDoc) {
      if (vDoc.doc_type === 'certificate') {
        const isUuid = UUID_REGEX.test(vDoc.reference_id)
        let certQuery = admin.from('certificates').select('id, certificate_id, student_name, course_name, issue_date')

        if (isUuid) {
          certQuery = certQuery.or(`id.eq.${vDoc.reference_id},certificate_id.eq.${vDoc.reference_id}`)
        } else {
          certQuery = certQuery.ilike('certificate_id', vDoc.reference_id)
        }

        const { data: cert } = await certQuery.limit(1).maybeSingle()
        if (cert && cert.issue_date) {
          const result = {
            status: 'Valid' as const,
            document_type: 'certificate',
            student_name: maskName(cert.student_name),
            course_name: cert.course_name,
            issue_date: cert.issue_date,
            invoice_number: null,
          }
          logProductEvent('verification_hit', requestId, { valid: true })
          return NextResponse.json({ data: result }, { headers })
        }
      } else if (vDoc.doc_type === 'invoice') {
        const isUuid = UUID_REGEX.test(vDoc.reference_id)
        let payQuery = admin
          .from('payments')
          .select('id, invoice, payment_date, student_name, student_id, students(name, course)')

        if (isUuid) {
          payQuery = payQuery.or(`id.eq.${vDoc.reference_id},invoice.eq.${vDoc.reference_id}`)
        } else {
          payQuery = payQuery.ilike('invoice', vDoc.reference_id)
        }

        const { data: pay } = await payQuery.limit(1).maybeSingle()
        if (pay && pay.payment_date) {
          const studentObj = Array.isArray(pay.students) ? pay.students[0] : pay.students
          const studentName = studentObj?.name || pay.student_name
          const courseName = studentObj?.course || null

          const result = {
            status: 'Valid' as const,
            document_type: 'invoice',
            student_name: maskName(studentName),
            course_name: courseName,
            issue_date: pay.payment_date,
            invoice_number: pay.invoice,
          }
          logProductEvent('verification_hit', requestId, { valid: true })
          return NextResponse.json({ data: result }, { headers })
        }
      }
    }

    // B. Direct lookup on certificates table if code itself is a certificate_id
    const { data: directCert } = await admin
      .from('certificates')
      .select('id, certificate_id, student_name, course_name, issue_date')
      .ilike('certificate_id', code)
      .limit(1)
      .maybeSingle()

    if (directCert && directCert.issue_date) {
      const result = {
        status: 'Valid' as const,
        document_type: 'certificate',
        student_name: maskName(directCert.student_name),
        course_name: directCert.course_name,
        issue_date: directCert.issue_date,
        invoice_number: null,
      }
      logProductEvent('verification_hit', requestId, { valid: true })
      return NextResponse.json({ data: result }, { headers })
    }

    // C. Direct lookup on payments table if code itself is an invoice number
    const { data: directPay } = await admin
      .from('payments')
      .select('id, invoice, payment_date, student_name, students(name, course)')
      .ilike('invoice', code)
      .limit(1)
      .maybeSingle()

    if (directPay && directPay.payment_date) {
      const studentObj = Array.isArray(directPay.students) ? directPay.students[0] : directPay.students
      const studentName = studentObj?.name || directPay.student_name
      const courseName = studentObj?.course || null

      const result = {
        status: 'Valid' as const,
        document_type: 'invoice',
        student_name: maskName(studentName),
        course_name: courseName,
        issue_date: directPay.payment_date,
        invoice_number: directPay.invoice,
      }
      logProductEvent('verification_hit', requestId, { valid: true })
      return NextResponse.json({ data: result }, { headers })
    }

    logProductEvent('verification_hit', requestId, { valid: false })
    return NextResponse.json({ data: invalid }, { headers })
  } catch (error) {
    logger.error(
      { requestId, errorType: error instanceof Error ? error.name : typeof error },
      'Document verification failed',
    )
    Sentry.captureException(error, { tags: { request_id: requestId, route: '/api/verify/[code]' } })
    return NextResponse.json({ data: invalid }, { headers })
  }
}

export const GET = withApi({ public: true, params: z.object({ code: z.string() }) }, async ({ params, requestId }) =>
  verifyDocument(requestId, params.code),
)
