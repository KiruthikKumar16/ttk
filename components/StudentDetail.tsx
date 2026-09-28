import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, BarChart3, Bell, CheckCircle2, ChevronDown, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Printer, Search, Settings, ShieldCheck, Users, X, MoreHorizontal, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Course, Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { PaymentsTable } from '@/components/PaymentsTable'
import { calculateGstForRupees, differenceRupees, percentageOfRupees, rupeesToPaise } from '@/lib/money'
// We'll import CertificatePrint and InvoicePrint later, for now we'll comment out and use placeholders
// import { CertificatePrint } from '@/components/CertificatePrint'
// import { InvoicePrint } from '@/components/InvoicePrint'

export function StudentDetail({
  student,
  payments,
  onBack,
  onPayment,
  onCertificate,
  onInvoice,
  gstRate = 18,
  courses,
}: {
  student: Student
  payments: Payment[]
  onBack: () => void
  onPayment: (amount: number, method: string) => Promise<Receipt | string>
  onCertificate: () => void
  onInvoice?: (p: Payment) => void
  gstRate?: number
  courses?: Course[]
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const balance = differenceRupees(student.total, student.paid)
  const history = payments.filter(p => p.studentId === student.registerId);
  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return setError('Enter a payment amount greater than zero.');
    // We assume onPayment returns a Promise that resolves to a Receipt or a string error
    const result = await onPayment(value, method);
    if (rupeesToPaise(value) > rupeesToPaise(balance)) return setError("Payment cannot exceed the remaining balance of " + money(balance) + ".");
    if (typeof result === 'string') return setError(result);
    setReceipt(result);
    setAmount('');
    setError('');
  };
  return (
    <>
      <div className="flex flex-col items-start w-full mb-8">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to students
        </Button>
        <div className="mt-8 text-left">
          <p className="eyebrow">STUDENT DETAIL · TAI-{student.registerId}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, margin: '4px 0 8px' }}>
            {student.name}
          </h1>
          <p className="subcopy">
            {student.course} · Batch started {student.batch} · <span className="font-semibold text-gray-800">Phone: {student.phone || '—'}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <Status status={student.status} />
        {(student.studentSource || (student as any).leadSource) && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Source: {student.studentSource || (student as any).leadSource}
          </span>
        )}
      </div>

      {/* Student Demographic & Personal Profile Card */}
      <section className="panel mb-6 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Personal & Student Profile</h2>
            <p className="text-xs text-gray-400">Communication channels, address, and student background</p>
          </div>
          {student.gender && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gray-100 text-gray-700">
              {student.gender} {student.maritalStatus ? `· ${student.maritalStatus}` : ''}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Primary Phone</span>
            <strong className="text-gray-800 font-mono text-sm">+91 {student.phone}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Alternate Phone</span>
            <strong className="text-gray-800 font-mono">{student.altPhone ? `+91 ${student.altPhone}` : '—'}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Email Address</span>
            <strong className="text-gray-800 truncate block">{student.email || '—'}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Date of Birth</span>
            <strong className="text-gray-800">{student.dob || '—'}</strong>
          </div>

          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Location</span>
            <strong className="text-gray-800">
              {[student.area, student.city, student.state].filter(Boolean).join(', ') || 'Tamil Nadu, India'}
            </strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Country</span>
            <strong className="text-gray-800">{student.country || 'India'}</strong>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 block mb-0.5 font-medium">Knowledge / Interest Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {student.knowledgeTags && student.knowledgeTags.length > 0 ? (
                student.knowledgeTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No tags assigned</span>
              )}
            </div>
          </div>
        </div>

        {student.comments && (
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs">
            <span className="text-gray-400 font-medium block mb-1">Counselor Notes / Remarks:</span>
            <p className="text-gray-700 italic bg-slate-50 p-2.5 rounded-md border border-slate-100">
              &ldquo;{student.comments}&rdquo;
            </p>
          </div>
        )}
      </section>
      <div className="detail-grid">
        <section className="panel fee-summary">
          <div className="panel-header">
            <div>
              <h2>Fee summary</h2>
              <p>Live account balance</p>
            </div>
          </div>
          <div className="balance-hero">
            <div className="balance-label">Balance</div>
            <div className={balance === 0 ? "balance-amount zero" : "balance-amount owed"}>
              {money(balance)}
            </div>
            <div className="balance-progress">
                 <div className="balance-progress-fill" style={{ width: percentageOfRupees(student.paid, student.total) + "%" }} />
            </div>
            <div className="fee-meta">
              <div>
                <span>Total fees</span>
                <strong>{money(student.total)}</strong>
              </div>
              <div>
                <span>Paid</span>
                <strong className="paid-number">{money(student.paid)}</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="panel payment-panel">
          <div className="panel-header">
            <div>
              <h2>Record Payment</h2>
              <p>Post a payment and issue its GST invoice</p>
            </div>
            <CircleDollarSign size={21} />
          </div>
          {receipt && balance === 0 ? (
            <div className="certificate-inline">
              <div className="receipt-check">
                <CheckCircle2 size={18} />
                <strong>Payment recorded</strong>
              </div>
              <p>Balance cleared. Certificate generation is ready below.</p>
            </div>
          ) : receipt ? (() => {
            const isInclusive = Boolean(courses?.find(c => c.name === student.course)?.gstInclusive);
            const receiptBreakdown = calculateGstForRupees(receipt.amount, gstRate, isInclusive);
            const receiptTaxable = receiptBreakdown.taxableAmount;
            const receiptGst = receiptBreakdown.gstAmount;
            const receiptHalfGst = receiptBreakdown.cgstAmount;
            const receiptSgst = receiptBreakdown.sgstAmount;
            const receiptGrandTotal = receiptBreakdown.totalAmount;

            return (
              <div className="receipt-confirmation">
                <div className="receipt-check">
                  <CheckCircle2 size={18} />
                  <strong>Payment recorded</strong>
                </div>
                <div className="receipt-meta">
                  <span>Invoice <b>{receipt.invoice}</b></span>
                  <span>Taxable Amount <b>{money(receiptTaxable)}</b></span>
                </div>
                {gstRate > 0 ? (
                  <div className="gst-breakdown">
                    <span>Taxable Base <b>{money(receiptTaxable)}</b></span>
                    <span>CGST ({(gstRate / 2)}%) <b>{money(receiptHalfGst)}</b></span>
                    <span>SGST ({(gstRate / 2)}%) <b>{money(receiptSgst)}</b></span>
                    <span>Grand Total <b>{money(receiptGrandTotal)}</b> {isInclusive && <small className="text-emerald-600 font-medium">(Incl. GST)</small>}</span>
                  </div>
                ) : (
                  <div className="gst-breakdown">
                    <span>Total Paid <b>{money(receipt.amount)}</b></span>
                    <span>GST <b>Exempt</b></span>
                  </div>
                )}
                {onInvoice && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInvoice({
                        id: receipt.id,
                        student: receipt.student,
                        method: receipt.method,
                        date: receipt.date,
                        amount: receipt.amount,
                        invoice: receipt.invoice,
                        studentId: receipt.studentId,
                      })}
                    >
                      <Printer size={14} className="mr-1.5" /> View Invoice
                    </Button>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="payment-fields">
              <label>
                Amount
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={money(balance)}
                />
              </label>
              <label>
                Payment method
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                >
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Card</option>
                </select>
              </label>
              <Button variant="default" size="default" onClick={submit}>
                Record payment
                <ArrowUpRight size={15} />
              </Button>
              {error && <p className="error">{error}</p>}
            </div>
          )}
        </section>
      </div>
      {receipt && differenceRupees(student.total, student.paid) === 0 ? (
        <section className="certificate-banner">
          <div>
            <p className="eyebrow">PAYMENT COMPLETE</p>
            <h2>Eligible for Course Completion Certificate</h2>
            <p>{student.name}&apos;s balance is fully cleared. Generate the completion certificate now.</p>
            <Button variant="default" size="default" onClick={onCertificate}>
              <FileCheck2 size={16} />
              <span className="ml-2">Generate certificate</span>
            </Button>
          </div>
        </section>
      ) : null}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Payment history</h2>
            <p>{history.length} payment{history.length === 1 ? '' : 's'} · Most recent first</p>
          </div>
        </div>
        <PaymentsTable payments={history} onInvoice={onInvoice} />
      </section>
    </>
  );
}
