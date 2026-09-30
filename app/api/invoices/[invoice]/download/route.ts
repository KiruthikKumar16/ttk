import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentFromRow, studentFromRow } from '@/lib/server-data'
import { unexpectedApiError } from '@/lib/api-response'
import QRCode from 'qrcode'
import { brand } from '@/lib/brand'
import { calculateGstFromParts, calculateGstInclusive, formatINR, rupeesToPaise } from '@/lib/money'
import { withApi } from '@/lib/http/handler'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 15

async function getCachedPdf(cachePath: string): Promise<Uint8Array | null> {
  try {
    const { data, error } = await getSupabaseAdminClient().storage.from('invoice-pdf-cache').download(cachePath)
    if (error) {
      if (error.statusCode !== '404') {
        logger.warn({ operation: 'download' }, 'Invoice PDF cache unavailable')
      }
      return null
    }
    return data ? new Uint8Array(await data.arrayBuffer()) : null
  } catch {
    logger.warn({ operation: 'download' }, 'Invoice PDF cache unavailable')
    return null
  }
}

async function storeCachedPdf(cachePath: string, bytes: Uint8Array): Promise<void> {
  try {
    const { error } = await getSupabaseAdminClient().storage.from('invoice-pdf-cache').upload(cachePath, bytes, {
      contentType: 'application/pdf',
      cacheControl: '31536000',
      upsert: true,
    })
    if (error) logger.warn({ operation: 'upload' }, 'Invoice PDF cache unavailable')
  } catch {
    logger.warn({ operation: 'upload' }, 'Invoice PDF cache unavailable')
  }
}

// This route is intended for authenticated staff use only to download payment invoices.
// The eventual public verification flow (QR/verify prompts) will be a SEPARATE,
// deliberately public and minimal route - don't merge the two.

async function getInvoicePdf(_request: Request, context: { params: Promise<{ invoice: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const { invoice } = await context.params
  const decodedInvoice = decodeURIComponent(invoice)

  const { data: paymentRow, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice', decodedInvoice)
    .maybeSingle()
  if (paymentError) return unexpectedApiError(paymentError, 'Failed to load invoice payment')

  // If invoice not found, return 404 instead of generating placeholder PDF
  if (!paymentRow) {
    return new NextResponse(JSON.stringify({ error: 'Invoice not found' }), { status: 404 })
  }

  const { data: verification, error: verificationError } = await supabase
    .from('verifiable_documents')
    .select('verification_code')
    .eq('doc_type', 'invoice')
    .eq('reference_id', String(paymentRow.id))
    .maybeSingle()
  if (verificationError) return unexpectedApiError(verificationError, 'Failed to load invoice verification data')
  const payment = paymentFromRow({
    ...paymentRow,
    verification_code: verification?.verification_code,
  })
  const { data: studentRow, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', paymentRow.student_id)
    .maybeSingle()
  if (studentError) return unexpectedApiError(studentError, 'Failed to load invoice student')
  const student = studentRow ? studentFromRow(studentRow) : undefined

  const { data: gstSettings, error: gstError } = await supabase
    .from('gst_settings')
    .select('gstin')
    .eq('id', 'default')
    .maybeSingle()
  if (gstError) return unexpectedApiError(gstError, 'Failed to load invoice GST settings')
  const gstin = typeof gstSettings?.gstin === 'string' && gstSettings.gstin.trim() ? gstSettings.gstin.trim() : null

  // Hash the complete invoice inputs so edits to the student, payment, GSTIN, or
  // verification code create a fresh private cache object without serving stale PDFs.
  const pdfVersion = createHash('sha256')
    .update(
      JSON.stringify({ paymentRow, studentRow, gstin, verificationCode: verification?.verification_code ?? null }),
    )
    .digest('hex')
  const paymentCacheId = createHash('sha256').update(String(paymentRow.id)).digest('hex')
  const cachePath = `${paymentCacheId}/${pdfVersion}.pdf`
  const cachedPdf = await getCachedPdf(cachePath)
  if (cachedPdf) {
    return new NextResponse(cachedPdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${decodedInvoice.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const storedGstRate = Number(payment.gstRate ?? 18)
  const storedCgst = Number(payment.cgst ?? 0)
  const storedSgst = Number(payment.sgst ?? 0)
  const grossAmount = Number(payment.amount ?? 0)

  const grossPaise = rupeesToPaise(grossAmount)
  const cgstPaise = rupeesToPaise(storedCgst)
  const sgstPaise = rupeesToPaise(storedSgst)
  const invoiceBreakdown =
    cgstPaise > 0 || sgstPaise > 0
      ? calculateGstFromParts(grossPaise, cgstPaise, sgstPaise)
      : calculateGstInclusive(grossPaise, storedGstRate)
  const taxablePaise = invoiceBreakdown.taxablePaise
  const totalGstPaise = invoiceBreakdown.gstPaise

  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage([595, 842])
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(resolve(process.cwd(), 'public/fonts/NotoSans-Regular.ttf')),
    readFile(resolve(process.cwd(), 'public/fonts/NotoSans-Bold.ttf')),
  ])
  const regular = await pdf.embedFont(regularBytes, { subset: true })
  const bold = await pdf.embedFont(boldBytes, { subset: true })
  const navy = rgb(0.055, 0.11, 0.24)
  const gold = rgb(0.66, 0.51, 0.16)
  const money = formatINR

  // Generate QR code for invoice verification
  let qrCodeImage
  try {
    if (payment.verification_code) {
      const verificationUrl = `${brand.verifyBaseUrl}/verify/${payment.verification_code}`
      const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 150,
        margin: 1,
      })
      qrCodeImage = await pdf.embedPng(qrCodeBuffer)
    }
  } catch (err) {
    console.error('Invoice PDF QR generation failed.')
    // Continue without QR code if generation fails
  }
  page.drawText(brand.legalName, { x: 48, y: 780, size: 22, font: bold, color: navy })
  page.drawText('COURSE PAYMENT TAX INVOICE', { x: 48, y: 754, size: 11, font: bold, color: gold })
  page.drawLine({ start: { x: 48, y: 740 }, end: { x: 547, y: 740 }, thickness: 1.5, color: navy })
  const rows = [
    ['Invoice', payment.invoice],
    ['Receipt', payment.id],
    ['Date', payment.date],
    ['Student', student?.name ?? payment.student],
    ['Student ID', `TAI-${payment.studentId}`],
    ['Course', student?.course ?? 'Course fee payment'],
    ['Payment mode', payment.method],
  ]
  let y = 700
  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: 55, y, size: 10, font: bold, color: navy })
    page.drawText(value, { x: 170, y, size: 10, font: regular })
    y -= 23
  }
  y -= 12

  // Draw QR code for verification (positioned on the right side)
  if (qrCodeImage) {
    const qrSize = 80
    const qrX = 547 - qrSize - 48 // Right-aligned with margin
    const qrY = y - qrSize + 20 // Position above the tax section
    page.drawImage(qrCodeImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    })

    // Add label for QR code
    page.drawText('Verify Invoice', { x: qrX, y: qrY - 10, size: 8, font: regular, color: navy })
    page.drawText(payment.verification_code || '', { x: qrX, y: qrY - 20, size: 8, font: regular, color: navy })
  }

  page.drawRectangle({ x: 48, y: y - 26, width: 499, height: 28, color: navy })
  page.drawText('Description', { x: 60, y: y - 17, size: 10, font: bold, color: rgb(1, 1, 1) })
  page.drawText('Taxable value', { x: 300, y: y - 17, size: 10, font: bold, color: rgb(1, 1, 1) })
  page.drawText('Amount', { x: 460, y: y - 17, size: 10, font: bold, color: rgb(1, 1, 1) })
  y -= 58
  const gstLabel = totalGstPaise > 0 ? `GST (${storedGstRate}%)` : 'GST'
  const invoiceRows = [
    ['Course fee payment', money(taxablePaise), money(taxablePaise)],
    [gstLabel, money(totalGstPaise), money(totalGstPaise)],
    ['Grand Total', '', money(grossPaise)],
  ]
  for (const [label, taxableValue, total] of invoiceRows) {
    page.drawText(label, {
      x: 60,
      y,
      size: 10,
      font: label === 'Grand Total' ? bold : regular,
      color: label === 'Grand Total' ? navy : rgb(0.15, 0.15, 0.15),
    })
    page.drawText(taxableValue, { x: 300, y, size: 10, font: regular })
    page.drawText(total, { x: 460, y, size: 10, font: label === 'Grand Total' ? bold : regular })
    page.drawLine({
      start: { x: 48, y: y - 8 },
      end: { x: 547, y: y - 8 },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    })
    y -= 28
  }
  page.drawText('This is a computer-generated invoice and does not require a signature.', {
    x: 48,
    y: 90,
    size: 9,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  })
  page.drawText(`${brand.legalName} | GSTIN: ${gstin ?? 'GSTIN not configured'}`, {
    x: 48,
    y: 72,
    size: 9,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  })
  const bytes = await pdf.save()
  await storeCachedPdf(cachePath, bytes)
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${decodedInvoice.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export const GET = withApi(
  {
    roles: ['admin', 'staff'] as const,
    params: z.object({ invoice: z.string().min(1) }),
  },
  async ({ request, params }) => getInvoicePdf(request, { params: Promise.resolve(params) }),
)
