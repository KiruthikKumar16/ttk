import { ArrowLeft, Printer, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Course, Payment, Student } from '@/lib/types'
import { money } from '@/lib/formatters'
import { amountInWords, calculateGstExclusive, calculateGstInclusive, paiseToRupees, rupeesToPaise } from '@/lib/money'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { brand } from '@/lib/brand'

const INVOICE_W = 794
const INVOICE_H = 562

const COURSE_OPTIONS = [
  'Full Stack Developer Course - Java',
  'Full Stack Developer Course - Python',
  'Full Stack Developer Course - MERN',
  'Data Science & Machine Learning',
  'Python Programming',
  'Web Design & Development',
  'Android App Development',
  'Digital Marketing',
]

const PAYMENT_TYPES = [
  '1st Part Fees Payment',
  '2nd Part Fees Payment',
  '3rd Part Fees Payment',
  '4th Part Fees Payment',
  'Full Course Fees Payment',
  'Registration Fees',
]

const PAYMENT_MODES = ['Cash', 'Online Transfer', 'UPI', 'Cheque', 'Card']

function genInvSuffix() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return mm + dd + hh + mi
}

function todayISO() {
  const today = new Date()
  return (
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')
  )
}

function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return day + '-' + months[parseInt(m) - 1] + '-' + y
}

type InvoiceFormState = {
  invoiceNumber: string
  receiptId: string
  date: string
  studentName: string
  mobile: string
  studentId: string
  courseName: string
  courseCustom: string
  paymentType: string
  grossAmount: string
  paymentMode: string
  transactionId: string
}

export function InvoicePrint({
  payment,
  student,
  onBack,
  gstRate = 18,
  gstin,
  courses,
}: {
  payment: Payment
  student?: Student
  onBack: () => void
  gstRate?: number
  gstin: string | null
  courses?: Course[]
}) {
  const invoiceStudent = student ?? {
    registerId: payment.studentId,
    name: payment.student,
    course: 'Course fee payment',
    batch: payment.date,
    total: payment.amount,
    paid: payment.amount,
    phone: '—',
    status: 'Fully Paid' as const,
  }

  const [form, setForm] = useState<InvoiceFormState>(() => {
    const suff = genInvSuffix()
    const y = new Date().getFullYear()
    return {
      invoiceNumber: payment.invoice || `${brand.invoicePrefix}/${y}/INV${suff}`,
      receiptId: payment.id || `${y}${suff}`,
      date: todayISO(),
      studentName: invoiceStudent.name,
      mobile: invoiceStudent.phone && invoiceStudent.phone !== '—' ? invoiceStudent.phone : '',
      studentId: `TAI-${invoiceStudent.registerId}`,
      courseName: COURSE_OPTIONS.includes(invoiceStudent.course) ? invoiceStudent.course : 'custom',
      courseCustom: COURSE_OPTIONS.includes(invoiceStudent.course) ? '' : invoiceStudent.course,
      paymentType: PAYMENT_TYPES[0],
      grossAmount: String(payment.amount),
      paymentMode: PAYMENT_MODES.includes(payment.method) ? payment.method : 'UPI',
      transactionId: '',
    }
  })

  const matchedCourse = courses?.find((c) => c.name === effectiveCourse(form))
  const isInclusive = Boolean(matchedCourse?.gstInclusive)

  const gross = parseFloat(form.grossAmount) || 0
  const grossPaise = rupeesToPaise(gross)
  const breakdown = isInclusive
    ? calculateGstInclusive(grossPaise, gstRate)
    : calculateGstExclusive(grossPaise, gstRate)
  const taxableValue = paiseToRupees(breakdown.taxablePaise)
  const gstAmount = paiseToRupees(breakdown.gstPaise)
  const halfGst = paiseToRupees(breakdown.cgstPaise)
  const grandTotal = paiseToRupees(breakdown.totalPaise)

  const containerRef = useRef<HTMLElement>(null)
  const [scale, setScale] = useState(1)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const scaleX = width / INVOICE_W
        const scaleY = height / INVOICE_H
        setScale(Math.min(scaleX, scaleY, 1))
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Generate QR code when payment verification code changes
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // For invoices, we need to get the verification code from the payment data
        // Since the InvoicePrint component receives a payment prop, we should check if it has verification_code
        if (payment.verification_code) {
          const verificationUrl = `${brand.verifyBaseUrl}/verify/${payment.verification_code}`
          const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 120,
            margin: 1,
          })
          setQrCode(qrCodeDataUrl)
        } else {
          setQrCode(null)
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err)
        setQrCode(null)
      }
    }

    generateQRCode()
  }, [payment.verification_code])

  const set = <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const resetForm = () => {
    const y = new Date().getFullYear()
    const suff = genInvSuffix()
    setForm((prev) => ({
      ...prev,
      studentName: '',
      mobile: '',
      courseName: COURSE_OPTIONS[0],
      courseCustom: '',
      paymentType: PAYMENT_TYPES[0],
      grossAmount: '',
      transactionId: '',
    }))
  }

  const newInvoice = () => {
    const suff = genInvSuffix()
    const y = new Date().getFullYear()
    setForm({
      invoiceNumber: `${brand.invoicePrefix}/${y}/INV${suff}`,
      receiptId: `${y}${suff}`,
      date: todayISO(),
      studentName: '',
      mobile: '',
      studentId: `${y}/TTK01/CUS${suff}`,
      courseName: COURSE_OPTIONS[0],
      courseCustom: '',
      paymentType: PAYMENT_TYPES[0],
      grossAmount: '',
      paymentMode: 'UPI',
      transactionId: '',
    })
  }

  return (
    <div className="preview-page">
      <div className="back-row">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>
      <div className="preview-layout">
        <aside className="edit-sidebar edit-sidebar-light">
          <div className="edit-sidebar-header edit-sidebar-header-light">
            <h2 className="edit-form-heading">Invoice Details</h2>
            <p className="edit-form-sub">Update the fields below — the invoice preview updates instantly.</p>
          </div>

          <div className="edit-sidebar-body invoice-editor-body">
            <div className="edit-section">
              <div className="edit-section-title">Invoice Details</div>
              <label className="edit-label">
                Invoice Number
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => set('invoiceNumber', e.target.value)}
                  className="edit-input edit-input-light"
                />
              </label>
              <div className="edit-row2">
                <label className="edit-label">
                  Receipt ID
                  <input
                    type="text"
                    value={form.receiptId}
                    onChange={(e) => set('receiptId', e.target.value)}
                    className="edit-input edit-input-light"
                  />
                </label>
                <label className="edit-label">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    className="edit-input edit-input-light"
                  />
                </label>
              </div>
              <div className="edit-label">
                GSTIN
                <div className="edit-input edit-input-light" aria-live="polite">
                  {gstin || 'GSTIN not configured'}
                </div>
              </div>
            </div>

            <div className="edit-section">
              <div className="edit-section-title">Student Details</div>
              <label className="edit-label">
                Student Name
                <input
                  type="text"
                  placeholder="e.g. Bala Dinisha B"
                  value={form.studentName}
                  onChange={(e) => set('studentName', e.target.value)}
                  className="edit-input edit-input-light"
                />
              </label>
              <div className="edit-row2">
                <label className="edit-label">
                  Mobile Number
                  <input
                    type="text"
                    placeholder="9XXXXXXXXX"
                    value={form.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                    className="edit-input edit-input-light"
                  />
                </label>
                <label className="edit-label">
                  Student ID
                  <input
                    type="text"
                    placeholder="2026/TTK01/CUS06241435"
                    value={form.studentId}
                    onChange={(e) => set('studentId', e.target.value)}
                    className="edit-input edit-input-light"
                  />
                </label>
              </div>
              <label className="edit-label">
                Course Name
                <select
                  value={form.courseName}
                  onChange={(e) => set('courseName', e.target.value)}
                  className="edit-input edit-input-light"
                >
                  {COURSE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="custom">— Type custom course —</option>
                </select>
              </label>
              {form.courseName === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter course name"
                  value={form.courseCustom}
                  onChange={(e) => set('courseCustom', e.target.value)}
                  className="edit-input edit-input-light mt-2"
                />
              )}
            </div>

            <div className="edit-section">
              <div className="edit-section-title">Payment Details</div>
              <label className="edit-label">
                Payment Type
                <select
                  value={form.paymentType}
                  onChange={(e) => set('paymentType', e.target.value)}
                  className="edit-input edit-input-light"
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="edit-label">
                Gross Amount (before GST) ₹
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5084.75"
                  value={form.grossAmount}
                  onChange={(e) => set('grossAmount', e.target.value)}
                  className="edit-input edit-input-light"
                />
              </label>
              {gross > 0 && (
                <div className="edit-amount-display">
                  <div className="edit-amount-row">
                    <span>{isInclusive ? 'Total (incl. GST)' : 'Gross Amount'}</span>
                    <span>{money(taxableValue)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="edit-amount-row">
                      <span>GST ({gstRate}%)</span>
                      <span>{money(gstAmount)}</span>
                    </div>
                  )}
                  <div className="edit-amount-row total">
                    <span>Grand Total</span>
                    <span>{money(grandTotal)}</span>
                  </div>
                </div>
              )}
              <div className="edit-row2" style={{ marginTop: 10 }}>
                <label className="edit-label">
                  Payment Mode
                  <select
                    value={form.paymentMode}
                    onChange={(e) => set('paymentMode', e.target.value)}
                    className="edit-input edit-input-light"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="edit-label">
                  Transaction ID
                  <input
                    type="text"
                    placeholder="(optional)"
                    value={form.transactionId}
                    onChange={(e) => set('transactionId', e.target.value)}
                    className="edit-input edit-input-light"
                  />
                </label>
              </div>
            </div>

          </div>

          <div className="edit-sidebar-actions">
            <div className="edit-actions-row">
              <Button variant="default" className="edit-btn" onClick={() => window.print()}>
                <Printer size={16} className="mr-2" /> Print / Save as PDF
              </Button>
              <Button variant="secondary" className="edit-btn" onClick={newInvoice}>
                <Plus size={16} className="mr-2" /> New
              </Button>
              <Button variant="ghost" className="edit-btn edit-btn-cert-reset" onClick={resetForm}>
                <RefreshCw size={16} className="mr-2" /> Reset
              </Button>
            </div>
          </div>
        </aside>

        <main
          className="preview-document-container"
          ref={containerRef}
          style={{ '--scale': scale } as React.CSSProperties}
        >
          <div className="preview-scaler-wrapper ttk-invoice-scaler">
            <div className="preview-scaler-content ttk-invoice-scaler-content">
              <article className="ttk-invoice-paper" id="invoice-paper">
                <InvoiceCopy
                  form={form}
                  taxableValue={taxableValue}
                  gstAmount={gstAmount}
                  halfGst={halfGst}
                  grandTotal={grandTotal}
                  gstRate={gstRate}
                  isInclusive={isInclusive}
                  gstin={gstin}
                  verificationCode={payment.verification_code}
                  qrCode={qrCode}
                  copy="Customer Copy"
                />
                <InvoiceCopy
                  form={form}
                  taxableValue={taxableValue}
                  gstAmount={gstAmount}
                  halfGst={halfGst}
                  grandTotal={grandTotal}
                  gstRate={gstRate}
                  isInclusive={isInclusive}
                  gstin={gstin}
                  verificationCode={payment.verification_code}
                  qrCode={qrCode}
                  copy="Office Copy"
                />
              </article>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function effectiveCourse(form: InvoiceFormState) {
  return form.courseName === 'custom' ? form.courseCustom : form.courseName
}

function InvoiceCopy({
  form,
  taxableValue,
  gstAmount,
  halfGst,
  grandTotal,
  gstRate,
  isInclusive,
  gstin,
  verificationCode,
  qrCode,
  copy,
}: {
  form: InvoiceFormState
  taxableValue: number
  gstAmount: number
  halfGst: number
  grandTotal: number
  gstRate: number
  isInclusive: boolean
  gstin: string | null
  verificationCode?: string
  qrCode: string | null
  copy: string
}) {
  const course = effectiveCourse(form) || '—'
  return (
    <section className="ttk-invoice-copy">
      <div className="ttk-invoice-top">
        <div>
          <h2>INVOICE - {form.invoiceNumber || '—'}</h2>
          <span>Receipt ID - [ {form.receiptId || '—'} ]</span>
        </div>
        <b>{copy}</b>
        {verificationCode && (
          <div className="invoice-verification-section">
            <div className="lbl">Verify Invoice</div>
            <div className="qr-code-container">
              {qrCode ? <img src={qrCode} alt="Verify invoice" className="qr-code" /> : null}
            </div>
            <div className="verification-url">
              {brand.verifyBaseUrl}/verify/{verificationCode}
            </div>
          </div>
        )}
      </div>
      <header className="ttk-invoice-brand">
        <div className="ttk-invoice-logo">
          <img src={brand.logoPath} alt={brand.shortName} />
        </div>
        <div>
          <h1>{brand.legalName}</h1>
          <p>127, Ettayapuram Road, Melur Tuticorin, Tamil Nadu - 628002</p>
          <p>Phone: 9244575008 | {brand.tagline}</p>
          <strong>GST No: {gstin || 'GSTIN not configured'}</strong>
        </div>
      </header>
      <div className="ttk-invoice-meta">
        <span>
          <b>Customer:</b> {form.studentName || '—'}
        </span>
        <span>
          <b>Mobile:</b> {form.mobile || '—'}
        </span>
        <span>
          <b>ID:</b> {form.studentId || '—'}
        </span>
        <span>
          <b>Date:</b> {fmtDate(form.date)}
        </span>
      </div>
      <p className="ttk-course-line">
        <b>Course:</b> {course}
      </p>
      <div className="ttk-invoice-grid">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Particular</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>{form.paymentType || 'Course fee payment'}</td>
              <td>{money(taxableValue)}</td>
            </tr>
            {gstRate > 0 && (
              <>
                <tr className="ttk-gst-row">
                  <td />
                  <td>CGST ({gstRate / 2}%)</td>
                  <td>{money(halfGst)}</td>
                </tr>
                <tr className="ttk-gst-row">
                  <td />
                  <td>SGST ({gstRate / 2}%)</td>
                  <td>{money(gstAmount - halfGst)}</td>
                </tr>
              </>
            )}
            <tr className="ttk-total-row">
              <td />
              <td>Grand Total</td>
              <td>{money(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div className="ttk-payment-aside">
          <span>Payment Mode</span>
          <strong>{form.paymentMode || '—'}</strong>
          <span>Transaction ID</span>
          <strong>{form.transactionId || form.receiptId || '—'}</strong>
        </div>
      </div>
      <p className="ttk-amount-words">{grandTotal > 0 ? amountInWords(rupeesToPaise(grandTotal)) : '—'}</p>
      <div className="ttk-invoice-terms">
        <b>Terms &amp; Conditions</b>
        <ol>
          {gstRate > 0 ? (
            isInclusive ? (
              <li>Course fee is inclusive of GST ({gstRate}%).</li>
            ) : (
              <li>GST ({gstRate}%) is charged on top of the base course fee.</li>
            )
          ) : (
            <li>No GST applicable on this invoice.</li>
          )}
          <li>Students must pay the full fees before completing the course.</li>
          <li>Agreed instalment dates help students complete the course on schedule.</li>
          <li>Registration fees are non-refundable once paid.</li>
          <li>Refunds are not allowed under normal circumstances.</li>
        </ol>
      </div>
      <div className="ttk-authorized">Authorized Signature</div>
    </section>
  )
}
