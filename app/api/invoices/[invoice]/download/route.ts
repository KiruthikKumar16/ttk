import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { NextResponse } from 'next/server'
import { listPayments, listStudents } from '@/lib/server-data'

export async function GET(_request: Request, context: { params: Promise<{ invoice: string }> }) {
  const { invoice } = await context.params
  const decodedInvoice = decodeURIComponent(invoice)
  const [payments, students] = await Promise.all([listPayments(), listStudents()])
  const payment = payments.find(item => item.invoice === decodedInvoice) ?? { id: 'CLIENT-RECEIPT', student: 'ThoorigAI customer', method: 'Recorded payment', date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), amount: 0, invoice: decodedInvoice, studentId: 0 }
  const student = students.find(item => item.registerId === payment.studentId)
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const navy = rgb(0.055, 0.11, 0.24)
  const gold = rgb(0.66, 0.51, 0.16)
  const taxable = payment.amount / 1.18
  const gst = payment.amount - taxable
  const money = (value: number) => `INR ${value.toFixed(2)}`
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
  page.drawRectangle({ x: 48, y: y - 26, width: 499, height: 28, color: navy })
  page.drawText('Description', { x: 60, y: y - 17, size: 10, font: bold, color: rgb(1, 1, 1) })
  page.drawText('Taxable value', { x: 300, y: y - 17, size: 10, font: bold, color: rgb(1, 1, 1) })
  page.drawText('Amount', { x: 460, y: y - 17, size: 10, font: bold, color: rgb(1, 1, 1) })
  y -= 58
  const invoiceRows = [['Course fee payment', money(taxable), money(taxable)], ['GST (18%)', money(gst), money(gst)], ['Grand Total', '', money(payment.amount)]]
  for (const [label, taxableValue, total] of invoiceRows) {
    page.drawText(label, { x: 60, y, size: 10, font: label === 'Grand Total' ? bold : regular, color: label === 'Grand Total' ? navy : rgb(0.15, 0.15, 0.15) })
    page.drawText(taxableValue, { x: 300, y, size: 10, font: regular })
    page.drawText(total, { x: 460, y, size: 10, font: label === 'Grand Total' ? bold : regular })
    page.drawLine({ start: { x: 48, y: y - 8 }, end: { x: 547, y: y - 8 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) })
    y -= 28
  }
  page.drawText('This is a computer-generated invoice and does not require a signature.', { x: 48, y: 90, size: 9, font: regular, color: rgb(0.35, 0.35, 0.35) })
  page.drawText('ThoorigAI Infotech LLP | GSTIN: 33AAZFT1234F1ZP', { x: 48, y: 72, size: 9, font: regular, color: rgb(0.35, 0.35, 0.35) })
  const bytes = await pdf.save()
  return new NextResponse(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${decodedInvoice.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"` } })
}
