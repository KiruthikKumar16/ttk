import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, BarChart3, Bell, CheckCircle2, ChevronDown, CircleDollarSign, FileCheck2, FileText, LayoutDashboard, Menu, Plus, Printer, Search, Settings, ShieldCheck, Users, X, MoreHorizontal, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Receipt, Student, View } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { PaymentsTable } from '@/components/PaymentsTable'
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
}: {
  student: Student
  payments: Payment[]
  onBack: () => void
  onPayment: (amount: number, method: string) => Promise<Receipt | string>
  onCertificate: () => void
  onInvoice?: (p: Payment) => void
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const balance = student.total - student.paid;
  const history = payments.filter(p => p.studentId === student.registerId);
  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return setError('Enter a payment amount greater than zero.');
    // We assume onPayment returns a Promise that resolves to a Receipt or a string error
    const result = await onPayment(value, method);
    if (value > balance) return setError("Payment cannot exceed the remaining balance of " + money(balance) + ".");
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
      <Status status={student.status} />
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
                 <div className="balance-progress-fill" style={{ width: ((student.paid / student.total) * 100) + "%" }} />
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
          ) : receipt ? (
            <div className="receipt-confirmation">
              <div className="receipt-check">
                <CheckCircle2 size={18} />
                <strong>Payment recorded</strong>
              </div>
              <div className="receipt-meta">
                <span>Invoice <b>{receipt.invoice}</b></span>
                <span>Amount <b>{money(receipt.amount)}</b></span>
              </div>
              <div className="gst-breakdown">
                <span>Taxable value <b>{money(receipt.amount - receipt.cgst - receipt.sgst)}</b></span>
                <span>CGST (9%) <b>{money(receipt.cgst)}</b></span>
                <span>SGST (9%) <b>{money(receipt.sgst)}</b></span>
                <span>Total paid <b>{money(receipt.amount)}</b></span>
              </div>
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
                    <Printer size={14} className="mr-1.5" />
                    View & Print Invoice
                  </Button>
                </div>
              )}
            </div>
          ) : (
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
      {receipt && student.total - student.paid === 0 ? (
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