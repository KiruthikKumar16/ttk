import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileCheck2,
  GraduationCap,
  Printer,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import type { Course, Payment, Receipt, Student, Role } from '@/lib/types'
import { PAYMENT_TYPES } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { CategoryBadge, getCategoryBadgeStyle } from '@/components/CategoryBadge'
import { PaymentsTable } from '@/components/shared/PaymentsTable'
import { calculateGstForRupees, differenceRupees, percentageOfRupees } from '@/lib/money'

export function StudentDetail({
  student,
  payments,
  onBack,
  onPayment,
  onCertificate,
  onInvoice,
  gstRate = 18,
  courses,
  canRecordPayment = true,
  role = 'admin',
  attendance = [],
  assessments = [],
}: {
  student: Student
  payments: Payment[]
  onBack: () => void
  onPayment: (amount: number, method: string, paymentType?: string) => Promise<Receipt | string>
  onCertificate: () => void
  onInvoice?: (p: Payment) => void
  gstRate?: number
  courses?: Course[]
  canRecordPayment?: boolean
  role?: Role
  attendance?: { id: string; sessionDate: string; status: 'Present' | 'Absent' | 'Late' | 'Excused' }[]
  assessments?: {
    id: string
    title: string
    date: string
    score: number
    maxScore: number
    remarks?: string | null
    gradedAt?: string | null
  }[]
}) {
  const isStaff = role === 'staff'
  const [activeTab, setActiveTab] = useState<'payments' | 'academics' | 'profile'>(
    isStaff || !canRecordPayment ? 'academics' : 'payments',
  )
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const balance = differenceRupees(student.total, student.paid)
  const history = payments.filter((p) => p.studentId === student.registerId)
  const defaultPaymentType =
    history.length === 0
      ? '1st Part Fees Payment'
      : history.length === 1
        ? '2nd Part Fees Payment'
        : history.length === 2
          ? '3rd Part Fees Payment'
          : `${history.length + 1}th Part Fees Payment`
  const [paymentType, setPaymentType] = useState<string>(defaultPaymentType)

  const handleInitiatePayment = () => {
    setError('')
    const val = Number(amount || balance)
    if (!val || val <= 0) {
      setError('Please enter a payment amount greater than zero.')
      return
    }
    if (val > balance) {
      setError(`Payment cannot exceed the outstanding balance of ${money(balance)}.`)
      return
    }
    if (!amount) {
      setAmount(String(balance))
    }
    setShowConfirmModal(true)
  }

  const handleConfirmPayment = async () => {
    const value = Number(amount || balance)
    if (!value || value <= 0) {
      setError('Enter a payment amount greater than zero.')
      setShowConfirmModal(false)
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const result = await onPayment(value, method, paymentType)
      if (typeof result === 'string') {
        setError(result)
        setIsSubmitting(false)
        return
      }
      setReceipt(result)
      setAmount('')
      setShowConfirmModal(false)
      if (result?.invoice && onInvoice) {
        onInvoice({
          id: result.id,
          student: result.student,
          method: result.method,
          date: result.date,
          amount: result.amount,
          invoice: result.invoice,
          studentId: result.studentId,
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const matchedCourse = courses?.find(
    (c) => c.name.toLowerCase().trim() === (student.course || '').toLowerCase().trim(),
  )
  const categoryName = matchedCourse?.categoryName
  const courseDuration = matchedCourse?.duration

  // Attendance metrics for staff & academic view
  const totalSessions = attendance.length
  const presentCount = attendance.filter((a) => a.status === 'Present').length
  const lateCount = attendance.filter((a) => a.status === 'Late').length
  const absentCount = attendance.filter((a) => a.status === 'Absent').length
  const attendedCount = presentCount + lateCount
  const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100

  // Assessment metrics
  const totalEvaluations = assessments.length
  const avgScore =
    totalEvaluations > 0
      ? Math.round(assessments.reduce((sum, a) => sum + (a.score / (a.maxScore || 100)) * 100, 0) / totalEvaluations)
      : 0
  const passedEvaluations = assessments.filter((a) => a.score / (a.maxScore || 100) >= 0.5).length

  return (
    <>
      <div className="breadcrumb">
        <button
          onClick={onBack}
          className="breadcrumb-back"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--muted)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} />
          Back to students
        </button>
      </div>

      <div className="detail-header">
        <div>
          <p className="eyebrow">
            {isStaff ? 'ACADEMY PROFILE' : 'STUDENT DETAIL'} · TAI-{student.registerId}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.15,
              margin: '4px 0 8px',
            }}
          >
            {student.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600 mt-1">
            <span className="font-semibold text-slate-900">{student.course}</span>
            {categoryName && <CategoryBadge categoryName={categoryName} duration={courseDuration} />}
            <span>·</span>
            <span>Batch started {student.batch}</span>
            <span>·</span>
            <span className="font-semibold text-slate-800">Phone: {student.phone || '—'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Status status={student.status} />
        {categoryName && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getCategoryBadgeStyle(categoryName).badge}`}
          >
            {categoryName} Tier {courseDuration ? `(${courseDuration})` : ''}
          </span>
        )}
        {!isStaff && (student.studentSource || (student as any).leadSource) && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Source: {student.studentSource || (student as any).leadSource}
          </span>
        )}
      </div>

      {/* Navigation Tab Bar */}
      <div
        role="tablist"
        aria-label="Student management tabs"
        className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto"
      >
        {!isStaff && canRecordPayment && (
          <button
            type="button"
            role="tab"
            id="student-tab-payments"
            aria-selected={activeTab === 'payments'}
            aria-controls="student-panel-payments"
            onClick={() => setActiveTab('payments')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <CreditCard size={15} />
            <span>Record Payments & Fees</span>
            {balance > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'payments' ? 'bg-indigo-700 text-indigo-100' : 'bg-amber-100 text-amber-800'
                }`}
              >
                Due: {money(balance)}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          role="tab"
          id="student-tab-academics"
          aria-selected={activeTab === 'academics'}
          aria-controls="student-panel-academics"
          onClick={() => setActiveTab('academics')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'academics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <GraduationCap size={15} />
          <span>Attendance & Academic Progress</span>
        </button>

        <button
          type="button"
          role="tab"
          id="student-tab-profile"
          aria-selected={activeTab === 'profile'}
          aria-controls="student-panel-profile"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Users size={15} />
          <span>Student Profile & Contacts</span>
        </button>
      </div>

      {/* ─── TAB 1: RECORD PAYMENTS & FEES ─── */}
      {!isStaff && canRecordPayment && activeTab === 'payments' && (
        <div id="student-panel-payments" role="tabpanel" aria-labelledby="student-tab-payments">
          <div className="detail-grid">
            {/* Fee summary card */}
            <section className="panel fee-summary">
              <div className="panel-header">
                <div>
                  <h2>Fee summary</h2>
                  <p>Live account balance</p>
                </div>
              </div>
              <div className="balance-hero">
                <div className="balance-label">Balance</div>
                <div className={balance === 0 ? 'balance-amount zero' : 'balance-amount owed'}>{money(balance)}</div>
                <div className="balance-progress">
                  <div
                    className="balance-progress-fill"
                    style={{ width: percentageOfRupees(student.paid, student.total) + '%' }}
                  />
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

            {/* Upgraded Record Payment Card */}
            <section className="panel payment-panel">
              <div className="panel-header">
                <div>
                  <h2>Record Payment</h2>
                  <p>Post a payment and issue its GST invoice</p>
                </div>
                <CircleDollarSign size={21} className="text-emerald-600" />
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
                (() => {
                  const isInclusive = Boolean(courses?.find((c) => c.name === student.course)?.gstInclusive)
                  const receiptBreakdown = calculateGstForRupees(receipt.amount, gstRate, isInclusive)
                  const receiptTaxable = receiptBreakdown.taxableAmount
                  const receiptHalfGst = receiptBreakdown.cgstAmount
                  const receiptSgst = receiptBreakdown.sgstAmount
                  const receiptGrandTotal = receiptBreakdown.totalAmount

                  return (
                    <div className="receipt-confirmation">
                      <div className="receipt-check">
                        <CheckCircle2 size={18} />
                        <strong>Payment recorded</strong>
                      </div>
                      <div className="receipt-meta">
                        <span>
                          Invoice <b>{receipt.invoice}</b>
                        </span>
                        <span>
                          Taxable Amount <b>{money(receiptTaxable)}</b>
                        </span>
                      </div>
                      {gstRate > 0 ? (
                        <div className="gst-breakdown">
                          <span>
                            Taxable Base <b>{money(receiptTaxable)}</b>
                          </span>
                          <span>
                            CGST ({gstRate / 2}%) <b>{money(receiptHalfGst)}</b>
                          </span>
                          <span>
                            SGST ({gstRate / 2}%) <b>{money(receiptSgst)}</b>
                          </span>
                          <span>
                            Grand Total <b>{money(receiptGrandTotal)}</b>{' '}
                            {isInclusive && <small className="text-emerald-600 font-medium">(Incl. GST)</small>}
                          </span>
                        </div>
                      ) : (
                        <div className="gst-breakdown">
                          <span>
                            Total Paid <b>{money(receipt.amount)}</b>
                          </span>
                          <span>
                            GST <b>Exempt</b>
                          </span>
                        </div>
                      )}
                      {onInvoice && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onInvoice({
                                id: receipt.id,
                                student: receipt.student,
                                method: receipt.method,
                                date: receipt.date,
                                amount: receipt.amount,
                                invoice: receipt.invoice,
                                studentId: receipt.studentId,
                              })
                            }
                          >
                            <Printer size={14} className="mr-1.5" /> View Invoice
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div className="payment-fields">
                  {/* Quick Amount Selectors */}
                  {balance > 0 && (
                    <div className="col-span-full mb-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Quick Amount Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAmount(String(balance))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            amount === String(balance)
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Full Due ({money(balance)})
                        </button>
                        {balance > 2000 && (
                          <button
                            type="button"
                            onClick={() => setAmount(String(Math.round(balance / 2)))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              amount === String(Math.round(balance / 2))
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            50% ({money(Math.round(balance / 2))})
                          </button>
                        )}
                        {balance >= 5000 && (
                          <button
                            type="button"
                            onClick={() => setAmount('5000')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              amount === '5000'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            ₹5,000
                          </button>
                        )}
                        {balance >= 10000 && (
                          <button
                            type="button"
                            onClick={() => setAmount('10000')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              amount === '10000'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            ₹10,000
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <label className="col-span-full">
                    Payment Type (Instance)
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                      {PAYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Amount (₹)
                    <input
                      type="number"
                      min="1"
                      max={balance}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value)
                        setError('')
                      }}
                      placeholder={money(balance)}
                    />
                  </label>

                  <label>
                    Payment method
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                      <option value="Cash">Cash Receipt</option>
                      <option value="Card">Debit / Credit Card</option>
                    </select>
                  </label>

                  {/* Upgraded High-Impact Record Payment Button */}
                  <div className="col-span-full pt-1">
                    <button
                      type="button"
                      id="record-payment-button"
                      disabled={balance <= 0 || isSubmitting}
                      onClick={handleInitiatePayment}
                      className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-md shadow-emerald-700/20 hover:shadow-lg hover:shadow-emerald-700/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <CreditCard size={18} className="text-emerald-100" />
                      <span>
                        Record payment
                        {amount && Number(amount) > 0
                          ? ` • ₹${Number(amount).toLocaleString('en-IN')}`
                          : balance > 0
                            ? ` • Full Dues ${money(balance)}`
                            : ''}
                      </span>
                      <ArrowRight size={16} className="text-emerald-200 ml-1" />
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Updates account balances and creates a verified GST invoice in the financial ledger.
                    </p>
                  </div>

                  {error && <p className="error">{error}</p>}
                </div>
              )}
            </section>
          </div>

          {canRecordPayment && receipt && differenceRupees(student.total, student.paid) === 0 ? (
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

          {/* Payment History Table */}
          <section className="panel mt-6">
            <div className="panel-header">
              <div>
                <h2>Payment history</h2>
                <p>
                  {history.length} payment{history.length === 1 ? '' : 's'} · Most recent first
                </p>
              </div>
            </div>
            <PaymentsTable payments={history} onInvoice={onInvoice} />
          </section>
        </div>
      )}

      {/* ─── TAB 2: ATTENDANCE & ACADEMICS ─── */}
      {activeTab === 'academics' && (
        <div id="student-panel-academics" role="tabpanel" aria-labelledby="student-tab-academics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classroom Attendance Card */}
            <section className="panel p-6 bg-white border border-slate-200/80 shadow-xs rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CalendarCheck size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Classroom Attendance</h2>
                      <p className="text-xs text-slate-500">Attendance sessions & presence rate</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      attendanceRate >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : attendanceRate >= 70
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {attendanceRate >= 80 ? 'Good Standing' : attendanceRate >= 70 ? 'Average' : 'Attendance Alert'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Rate
                    </span>
                    <strong
                      className={`text-2xl font-bold mt-0.5 block ${
                        attendanceRate >= 80
                          ? 'text-emerald-600'
                          : attendanceRate >= 70
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {totalSessions > 0 ? `${attendanceRate}%` : 'N/A'}
                    </strong>
                    <span className="text-[10px] text-slate-600 font-medium">
                      {totalSessions > 0 ? `${attendedCount}/${totalSessions} Sessions` : 'No logs yet'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                      Present
                    </span>
                    <strong className="text-2xl font-bold text-emerald-700 mt-0.5 block">{presentCount}</strong>
                    <span className="text-[10px] text-emerald-600 font-medium">{lateCount} late</span>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100">
                    <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                      Absent
                    </span>
                    <strong className="text-2xl font-bold text-rose-700 mt-0.5 block">{absentCount}</strong>
                    <span className="text-[10px] text-rose-600 font-medium">Missed</span>
                  </div>
                </div>

                {/* Recent Session Logs */}
                <div className="mt-5">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2">Recent Attendance Sessions</h3>
                  {attendance.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                      {attendance.slice(0, 5).map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between px-3 py-2 text-xs bg-white hover:bg-slate-50"
                        >
                          <span className="font-mono text-slate-600">{att.sessionDate}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              att.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : att.status === 'Late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {att.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic py-2">
                      No attendance sessions recorded yet for this student.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Link
                  href={`/attendance?search=${encodeURIComponent(student.name)}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs font-semibold' })}
                >
                  <CalendarCheck size={14} className="mr-1.5 text-emerald-600" />
                  Open Attendance Roster
                </Link>
              </div>
            </section>

            {/* Academic Assessments Card */}
            <section className="panel p-6 bg-white border border-slate-200/80 shadow-xs rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Award size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Academic Assessments</h2>
                      <p className="text-xs text-slate-500">Evaluations, test scores, & grades</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {totalEvaluations > 0 ? `${avgScore}% Average` : 'No tests yet'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Average
                    </span>
                    <strong className="text-2xl font-bold text-indigo-600 mt-0.5 block">
                      {totalEvaluations > 0 ? `${avgScore}%` : '—'}
                    </strong>
                    <span className="text-[10px] text-slate-600 font-medium">Cohort score</span>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                      Completed
                    </span>
                    <strong className="text-2xl font-bold text-indigo-700 mt-0.5 block">{totalEvaluations}</strong>
                    <span className="text-[10px] text-indigo-600 font-medium">Tests graded</span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                      Pass Rate
                    </span>
                    <strong className="text-2xl font-bold text-emerald-700 mt-0.5 block">
                      {totalEvaluations > 0 ? `${Math.round((passedEvaluations / totalEvaluations) * 100)}%` : '—'}
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-medium">{passedEvaluations} passed</span>
                  </div>
                </div>

                {/* Recent Assessment Results */}
                <div className="mt-5">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2">Evaluated Assessments</h3>
                  {assessments.length > 0 ? (
                    <div className="space-y-2">
                      {assessments.slice(0, 4).map((ass) => {
                        const pct = Math.round((ass.score / (ass.maxScore || 100)) * 100)
                        return (
                          <div
                            key={ass.id}
                            className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-slate-900 block font-semibold">{ass.title}</strong>
                              <span className="text-[11px] text-slate-600 font-mono">{ass.date || 'Recent'}</span>
                              {ass.remarks && (
                                <p className="text-[11px] text-slate-700 italic mt-0.5">&ldquo;{ass.remarks}&rdquo;</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 text-sm block">
                                {ass.score} / {ass.maxScore}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  pct >= 70
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pct >= 50
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {pct}% · {pct >= 50 ? 'Pass' : 'Retake'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic py-2">
                      No assessment evaluations posted yet for this student.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Link
                  href={`/assessments?search=${encodeURIComponent(student.name)}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs font-semibold' })}
                >
                  <Award size={14} className="mr-1.5 text-indigo-600" />
                  Enter Assessment Score
                </Link>
              </div>
            </section>
          </div>

          {/* Course Curriculum & Learning Materials Link */}
          <section className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Curriculum Learning Materials</h3>
                <p className="text-xs text-slate-600">
                  Access slide decks, code snippets, and handouts for {student.course}.
                </p>
              </div>
            </div>
            <Link
              href="/materials"
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs bg-white' })}
            >
              Browse Materials
              <ArrowUpRight size={13} className="ml-1" />
            </Link>
          </section>
        </div>
      )}

      {/* ─── TAB 3: PERSONAL PROFILE & DEMOGRAPHICS ─── */}
      {activeTab === 'profile' && (
        <div id="student-panel-profile" role="tabpanel" aria-labelledby="student-tab-profile">
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
                <strong className="text-gray-800 font-mono">
                  {student.altPhone ? `+91 ${student.altPhone}` : '—'}
                </strong>
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
                    student.knowledgeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-100"
                      >
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
        </div>
      )}

      {/* ─── CONFIRM SENSITIVE PAYMENT FLASH MODAL ─── */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-payment-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Security Pulse Flash Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 animate-pulse" />

            <div className="p-6">
              {/* Flash Header */}
              <div className="flex items-start gap-3.5 mb-4">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 mb-1">
                    Sensitive Financial Action
                  </span>
                  <h3 id="confirm-payment-title" className="text-base font-bold text-slate-900">
                    Confirm Tuition Payment Recording
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review ledger modifications before committing this transaction.
                  </p>
                </div>
              </div>

              {/* Transaction Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs mb-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Student</span>
                  <span className="font-semibold text-slate-900">
                    {student.name} <span className="font-mono text-slate-500">(#{student.registerId})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Course</span>
                  <span className="font-medium text-slate-800">{student.course}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Type (Instance)</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                    {paymentType}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Amount</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    ₹{Number(amount || balance).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-semibold text-slate-800">{method}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-slate-600">
                  <span>Balance Impact</span>
                  <span>
                    <span className="line-through text-slate-400 mr-1.5">{money(balance)}</span>
                    <strong className="text-slate-900 font-bold">
                      {money(Math.max(0, balance - Number(amount || balance)))}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Warning callout */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 mb-5 flex items-start gap-2">
                <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <p>
                  This action writes an irreversible record to the database ledger and creates a legal GST invoice.
                  Ensure payment has been received in full.
                </p>
              </div>

              {error && <p className="text-xs text-rose-600 font-semibold mb-3">{error}</p>}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmModal(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleConfirmPayment}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm & Record ₹{Number(amount || balance).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
