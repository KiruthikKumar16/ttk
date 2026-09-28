import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { listPayments, listStudents } from '@/lib/server-data'
import QRCode from 'qrcode'

// This route is intended for authenticated staff use only to download payment invoices.
// The eventual public verification flow (QR/verify prompts) will be a SEPARATE,
// deliberately public and minimal route - don't merge the two.

export async function GET(
  _request: Request,
  context: { params: Promise<{ invoice: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { invoice } = await context.params
  const decodedInvoice = decodeURIComponent(invoice)

  // Fetch data using per-request Supabase client (respects RLS)
  const [payments, students] = await Promise.all([
    listPayments(supabase),
    listStudents(supabase)
  ])

  // Find the payment with the matching invoice
  const payment = payments.find(item => item.invoice === decodedInvoice)

  // If invoice not found, return 404 instead of generating placeholder PDF
  if (!payment) {
    return new NextResponse(JSON.stringify({ error: 'Invoice not found' }), { status: 404 })
  }

  const student = students.find(item => item.registerId === payment.studentId)

  const storedGstRate = Number((payment.gstRate ?? 18))
  const storedCgst = Number((payment.cgst ?? 0))
  const storedSgst = Number((payment.sgst ?? 0))
  const grossAmount = Number(payment.amount ?? 0)

  let taxable: number
  let totalGst: number
  if (storedCgst > 0 || storedSgst > 0) {
    totalGst = storedCgst + storedSgst
    taxable = grossAmount - totalGst
    if (taxable < 0) {
      taxable = grossAmount
      totalGst = 0
    }
  } else if (storedGstRate > 0) {
    const divisor = 1 + (storedGstRate / 100)
    taxable = grossAmount / divisor
    totalGst = grossAmount - taxable
  } else {
    taxable = grossAmount
    totalGst = 0
  }

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const navy = rgb(0.055, 0.11, 0.24)
  const gold = rgb(0.66, 0.51, 0.16)
  const money = (value: number) => `INR ${value.toFixed(2)}`

  // Generate QR code for invoice verification
  let qrCodeImage
  try {
    if (payment.verification_code) {
      const verificationUrl = `https://verify.thoorigai.in/verify/${payment.verification_code}`
      const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 150,
        margin: 1,
      })
      qrCodeImage = await pdf.embedPng(qrCodeBuffer)
    }
  } catch (err) {
    console.error('Failed to generate QR code for invoice PDF:', err)
    // Continue without QR code if generation fails
  }
  page.drawText('ThoorigAI Infotech LLP', { x: 48, y: 780, size: 22, font: bold, color: navy })
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
    const qrX = 547 - qrSize - 48  // Right-aligned with margin
    const qrY = y - qrSize + 20    // Position above the tax section
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
  const gstLabel = totalGst > 0 ? `GST (${storedGstRate}%)` : 'GST'
  const invoiceRows = [['Course fee payment', money(taxable), money(taxable)], [gstLabel, money(totalGst), money(totalGst)], ['Grand Total', '', money(grossAmount)]]
  for (const [label, taxableValue, total] of invoiceRows) {
    page.drawText(label, { x: 60, y, size: 10, font: label === 'Grand Total' ? bold : regular, color: label === 'Grand Total' ? navy : rgb(0.15, 0.15, 0.15) })
    page.drawText(taxableValue, { x: 300, y, size: 10, font: regular })
    page.drawText(total, { x: 460, y, size: 10, font: label === 'Grand Total' ? bold : regular })
    page.drawLine({ start: { x: 48, y: y - 8 }, end: { x: 547, y: y - 8 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) })
    y -= 28
  }
  const gstinFromPayment = supabase ? (payment.gstin ?? undefined) : undefined
  const finalGstin = gstinFromPayment ?? (student?.gstin ?? '33AAZFT3654J1ZI')
  page.drawText('This is a computer-generated invoice and does not require a signature.', { x: 48, y: 90, size: 9, font: regular, color: rgb(0.35, 0.35, 0.35) })
  page.drawText(`ThoorigAI Infotech LLP | GSTIN: ${finalGstin}`, { x: 48, y: 72, size: 9, font: regular, color: rgb(0.35, 0.35, 0.35) })
  const bytes = await pdf.save()
  return new NextResponse(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${decodedInvoice.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"` } })
}
