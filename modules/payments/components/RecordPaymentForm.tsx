'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Search,
  ShieldCheck,
  User,
  Wallet,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/CategoryBadge'
import { money } from '@/lib/formatters'
import { PAYMENT_TYPES, type Course } from '@/lib/types'
import { calculateGstForRupees, differenceRupees, percentageOfRupees } from '@/lib/money'

export interface StudentPaymentCandidate {
  id: string
  registerId: number
  name: string
  course: string
  batch: string
  total: number
  paid: number
  phone: string
  email?: string
}

interface RecordPaymentFormProps {
  initialStudent?: StudentPaymentCandidate | null
  students: StudentPaymentCandidate[]
  courses: Course[]
  gstRate?: number
}

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / QR', desc: 'GPay, PhonePe, Paytm', icon: Wallet },
  { id: 'Bank Transfer', label: 'Bank Transfer', desc: 'NEFT / RTGS / IMPS', icon: Landmark },
  { id: 'Cash', label: 'Cash in Hand', desc: 'Front desk receipt', icon: Banknote },
  { id: 'Card', label: 'Debit / Credit', desc: 'POS Terminal', icon: CreditCard },
  { id: 'Cheque', label: 'Cheque / DD', desc: 'Bank clearance', icon: FileText },
]

export function RecordPaymentForm({ initialStudent = null, students, courses, gstRate = 18 }: RecordPaymentFormProps) {
  const router = useRouter()

  const [selectedStudent, setSelectedStudent] = useState<StudentPaymentCandidate | null>(initialStudent)
  const [studentSearch, setStudentSearch] = useState('')
  const [filterDueOnly, setFilterDueOnly] = useState(true)
  const [isChangingStudent, setIsChangingStudent] = useState(!initialStudent)

  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('UPI')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [transactionId, setTransactionId] = useState<string>('')
  const [customNote, setCustomNote] = useState<string>('')
  const [paymentType, setPaymentType] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Current balance of selected student
  const balance = selectedStudent ? Math.max(0, differenceRupees(selectedStudent.total, selectedStudent.paid)) : 0

  // Matched course details
  const matchedCourse = useMemo(() => {
    if (!selectedStudent?.course) return undefined
    return courses.find((c) => c.name.toLowerCase().trim() === selectedStudent.course.toLowerCase().trim())
  }, [selectedStudent, courses])

  const isGstInclusive = Boolean(matchedCourse?.gstInclusive)

  // Compute default payment type based on current paid / balance status
  useMemo(() => {
    if (!selectedStudent) return
    if (paymentType) return // don't override manual selection

    if (selectedStudent.paid === 0) {
      setPaymentType('1st Part Fees Payment')
    } else {
      setPaymentType('2nd Part Fees Payment')
    }
  }, [selectedStudent, paymentType])

  // Filtered students for selection
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    return students.filter((s) => {
      const studentBalance = differenceRupees(s.total, s.paid)
      if (filterDueOnly && studentBalance <= 0) return false

      if (!q) return true
      const idMatch = String(s.registerId).includes(q) || `tai-${s.registerId}`.includes(q)
      const nameMatch = s.name.toLowerCase().includes(q)
      const phoneMatch = s.phone.includes(q)
      const courseMatch = s.course.toLowerCase().includes(q)
      return idMatch || nameMatch || phoneMatch || courseMatch
    })
  }, [students, studentSearch, filterDueOnly])

  const handleSelectStudent = (student: StudentPaymentCandidate) => {
    setSelectedStudent(student)
    setIsChangingStudent(false)
    setStudentSearch('')
    setFormError(null)

    const bal = differenceRupees(student.total, student.paid)
    if (bal > 0) {
      setAmount(String(bal))
    } else {
      setAmount('')
    }

    if (student.paid === 0) {
      setPaymentType('1st Part Fees Payment')
    } else {
      setPaymentType('2nd Part Fees Payment')
    }
  }

  // Live tax breakdown
  const numAmount = Number(amount) || 0
  const gstBreakdown = useMemo(() => {
    if (numAmount <= 0) {
      return { taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, totalAmount: 0 }
    }
    return calculateGstForRupees(numAmount, gstRate, isGstInclusive)
  }, [numAmount, gstRate, isGstInclusive])

  const remainingAfterPayment = Math.max(0, balance - numAmount)

  const handleValidateAndReview = () => {
    setFormError(null)
    if (!selectedStudent) {
      setFormError('Please select a student first.')
      return
    }
    if (!numAmount || numAmount <= 0) {
      setFormError('Payment amount must be greater than ₹0.')
      return
    }
    if (numAmount > balance) {
      setFormError(`Payment of ${money(numAmount)} exceeds outstanding dues of ${money(balance)}.`)
      return
    }
    if (!method) {
      setFormError('Please choose a payment method.')
      return
    }

    setShowConfirmModal(true)
  }

  const handleCommitPayment = async () => {
    if (!selectedStudent) return
    setIsSubmitting(true)
    setFormError(null)

    try {
      const idempotencyKey = crypto.randomUUID()
      const payload = {
        studentId: selectedStudent.registerId,
        amount: numAmount,
        method,
        date: date || new Date().toISOString().slice(0, 10),
        paymentType: paymentType || 'Part Fees Payment',
        transactionId: transactionId.trim() || undefined,
        customNote: customNote.trim() || undefined,
        gstRate,
        cgst: gstBreakdown.cgstAmount,
        sgst: gstBreakdown.sgstAmount,
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to record payment.')
      }

      const invoiceNum = json?.data?.invoice || ''

      // Directs to student profile with celebration query params
      router.push(
        `/students/${selectedStudent.registerId}?paymentSuccess=true${invoiceNum ? `&invoice=${encodeURIComponent(invoiceNum)}` : ''}`,
      )
      router.refresh()
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record payment. Please check your network and try again.')
      setShowConfirmModal(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Invoices</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              New Ledger Transaction
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CircleDollarSign className="text-emerald-600 shrink-0" size={26} />
            <span>Record Payment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Commit student fee receipts into the financial ledger and generate compliant GST tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedStudent && (
            <Link
              href={`/students/${selectedStudent.registerId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <User size={14} className="text-slate-500" />
              <span>View Profile</span>
            </Link>
          )}
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Receipt size={14} className="text-slate-500" />
            <span>All Invoices</span>
          </Link>
        </div>
      </div>

      {/* STEP 1: STUDENT SELECTION OR ACTIVE STUDENT SUMMARY */}
      {selectedStudent && !isChangingStudent ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                {selectedStudent.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedStudent.name}</h2>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    TAI-{selectedStudent.registerId}
                  </span>
                  {matchedCourse?.categoryName && (
                    <CategoryBadge
                      categoryName={matchedCourse.categoryName}
                      duration={matchedCourse.duration}
                      className="text-[11px] px-2 py-0.5"
                    />
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{selectedStudent.course}</span>
                  <span>•</span>
                  <span>Batch: {selectedStudent.batch}</span>
                  <span>•</span>
                  <span>Phone: {selectedStudent.phone}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Widget */}
            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Remaining Dues
                </span>
                <span
                  className={`text-xl font-extrabold leading-tight block ${
                    balance > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {money(balance)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {money(selectedStudent.paid)} of {money(selectedStudent.total)} paid
                </span>
              </div>

              <div className="h-9 w-px bg-slate-200" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChangingStudent(true)}
                className="text-xs font-semibold"
              >
                Change Student
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Payment Progress</span>
              <span>{percentageOfRupees(selectedStudent.paid, selectedStudent.total)}% Complete</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{
                  width: `${percentageOfRupees(selectedStudent.paid, selectedStudent.total)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Student Search & Picker Box */
        <div className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User size={18} className="text-indigo-600" />
                <span>Select Student for Payment Recording</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search enrolled students to load their live fee ledger and record an installment.
              </p>
            </div>

            {selectedStudent && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsChangingStudent(false)}
                className="text-xs text-slate-500"
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            )}
          </div>

          {/* Search bar & filter pills */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by student name, ID (e.g. 101 or TAI-101), phone, or course..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setFilterDueOnly(true)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  filterDueOnly
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Outstanding Dues Only
              </button>
              <button
                type="button"
                onClick={() => setFilterDueOnly(false)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  !filterDueOnly
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Students
              </button>
            </div>
          </div>

          {/* Student selection grid/list */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((s) => {
                const sBalance = differenceRupees(s.total, s.paid)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left p-3 rounded-xl hover:bg-indigo-50/60 border border-transparent hover:border-indigo-200 transition-all flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-700 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">
                            {s.name}
                          </strong>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            TAI-{s.registerId}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">{s.course}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold block ${sBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
                      >
                        {sBalance > 0 ? `Due: ${money(sBalance)}` : 'Fully Paid'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Paid {money(s.paid)} / {money(s.total)}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No students found matching &ldquo;{studentSearch}&rdquo;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT FORM AND FINANCIAL BREAKDOWN */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Inputs (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Banknote size={18} className="text-emerald-600" />
                  <span>Payment Information</span>
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">Fields marked with * are required</span>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="payment-amount" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Payment Amount (INR ₹)*
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    ₹
                  </span>
                  <input
                    id="payment-amount"
                    type="number"
                    min="1"
                    max={balance > 0 ? balance : undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Quick Fill Chips */}
                <div className="flex items-center flex-wrap gap-2 mt-2.5">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                  {balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(balance))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Full Balance ({money(balance)})
                    </button>
                  )}
                  {balance > 2000 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(Math.round(balance / 2)))}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      50% Balance ({money(Math.round(balance / 2))})
                    </button>
                  )}
                  {[5000, 10000, 15000].map((preset) => {
                    if (preset > balance && balance > 0) return null
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        {money(preset)}
                      </button>
                    )
                  })}
                </div>

                {/* Real-time Balance Feedback */}
                {numAmount > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Balance after this payment:</span>
                    <strong
                      className={`font-bold ${remainingAfterPayment === 0 ? 'text-emerald-700' : 'text-slate-900'}`}
                    >
                      {remainingAfterPayment === 0 ? '₹0 (Fully Cleared)' : money(remainingAfterPayment)}
                    </strong>
                  </div>
                )}
              </div>

              {/* Payment Type / Milestone */}
              <div>
                <label htmlFor="payment-type" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Payment Milestone / Tier*
                </label>
                <div className="relative">
                  <select
                    id="payment-type"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                  >
                    {PAYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Specifies which installment or fees milestone is printed on the GST invoice.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">Payment Method*</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PAYMENT_METHODS.map((item) => {
                    const Icon = item.icon
                    const isSelected = method === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon size={18} className={isSelected ? 'text-emerald-700' : 'text-slate-500'} />
                          {isSelected && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                        </div>
                        <div>
                          <strong
                            className={`text-xs block font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}
                          >
                            {item.label}
                          </strong>
                          <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Two Column Grid: Date & Transaction ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payment-date" className="block text-xs font-bold text-slate-800 mb-1.5">
                    Payment Date*
                  </label>
                  <input
                    id="payment-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="transaction-id" className="block text-xs font-bold text-slate-800 mb-1.5">
                    UTR / Reference Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="transaction-id"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. UPI Ref / UTR / Cheque No."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Remarks / Custom Note */}
              <div>
                <label htmlFor="custom-note" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Internal Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="custom-note"
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Additional memo or reference notes for this transaction..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: GST & Invoice Breakdown + Actions (1 col) */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Receipt size={18} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">GST & Ledger Breakdown</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Course</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[170px]">
                    {selectedStudent.course}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>GST Rate</span>
                  <span className="font-semibold text-slate-900">
                    {gstRate > 0 ? `${gstRate}%` : 'Exempt'}
                    {isGstInclusive && (
                      <span className="text-[10px] text-emerald-600 font-medium ml-1">(Inclusive)</span>
                    )}
                  </span>
                </div>

                <div className="h-px bg-slate-100 my-1" />

                <div className="flex justify-between items-center text-slate-600">
                  <span>Taxable Base Value</span>
                  <span className="font-medium text-slate-900">{money(gstBreakdown.taxableAmount)}</span>
                </div>

                {gstRate > 0 && (
                  <>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>CGST ({gstRate / 2}%)</span>
                      <span className="font-medium text-slate-900">{money(gstBreakdown.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>SGST ({gstRate / 2}%)</span>
                      <span className="font-medium text-slate-900">{money(gstBreakdown.sgstAmount)}</span>
                    </div>
                  </>
                )}

                <div className="h-px bg-slate-200 my-1.5" />

                <div className="flex justify-between items-center">
                  <strong className="text-xs font-bold text-slate-900">Invoice Total</strong>
                  <strong className="text-base font-extrabold text-emerald-700">
                    {money(gstBreakdown.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Compliance Callout */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Committing this payment updates the student&apos;s ledger balance, issues an immutable invoice, and
                  redirects to their profile.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  onClick={handleValidateAndReview}
                  disabled={isSubmitting || numAmount <= 0}
                  className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CircleDollarSign size={16} />
                  <span>Review & Record Payment</span>
                  <ArrowRight size={14} />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="w-full text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION REVIEW MODAL */}
      {showConfirmModal && selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Strip */}
            <div className="h-1.5 w-full bg-emerald-600" />

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
                  <CircleDollarSign size={22} />
                </div>
                <div>
                  <h3 id="confirm-modal-title" className="text-base font-bold text-slate-900">
                    Confirm Fee Payment Recording
                  </h3>
                  <p className="text-xs text-slate-500">Verify transaction details before committing to the ledger.</p>
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs mb-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Student</span>
                  <span className="font-semibold text-slate-900">
                    {selectedStudent.name}{' '}
                    <span className="font-mono text-slate-500">(TAI-{selectedStudent.registerId})</span>
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Course</span>
                  <span className="font-medium text-slate-800">{selectedStudent.course}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Milestone</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {paymentType}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Amount</span>
                  <span className="text-base font-extrabold text-emerald-700">{money(numAmount)}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-semibold text-slate-800">{method}</span>
                </div>

                <div className="flex justify-between items-center pt-1 text-slate-600">
                  <span>Balance Impact</span>
                  <span>
                    <span className="line-through text-slate-400 mr-1.5">{money(balance)}</span>
                    <strong className="text-slate-900 font-bold">{money(remainingAfterPayment)}</strong>
                  </span>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

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
                  Back to Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleCommitPayment}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm & Record {money(numAmount)}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
