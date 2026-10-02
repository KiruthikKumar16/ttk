import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Compass,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  Printer,
  Receipt,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import type { Course, Payment, Receipt as ReceiptType, Student, Role } from '@/lib/types'
import { money } from '@/lib/formatters'
import { Status } from '@/components/Status'
import { CategoryBadge } from '@/components/CategoryBadge'
import { PaymentsTable } from '@/components/shared/PaymentsTable'
import { differenceRupees, percentageOfRupees } from '@/lib/money'

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function formatDateIso(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function StudentDetail({
  student,
  payments,
  onBack,
  onPayment: _onPayment,
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
  onPayment?: (amount: number, method: string, paymentType?: string) => Promise<ReceiptType | string>
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
  const balance = differenceRupees(student.total, student.paid)
  const history = payments.filter((p) => p.studentId === student.registerId)

  // Celebration banner when redirected from /invoices/record
  const searchParams = useSearchParams()
  const isPaymentSuccess = searchParams?.get('paymentSuccess') === 'true'
  const successInvoice = searchParams?.get('invoice')
  const [showSuccessBanner, setShowSuccessBanner] = useState(true)

  const matchedCourse = courses?.find(
    (c) => c.name.toLowerCase().trim() === (student.course || '').toLowerCase().trim(),
  )
  const categoryName = matchedCourse?.categoryName
  const courseDuration = matchedCourse?.duration

  // Attendance metrics
  const totalSessions = attendance.length
  const presentSessions = attendance.filter((a) => a.status === 'Present').length
  const lateSessions = attendance.filter((a) => a.status === 'Late').length
  const absentSessions = attendance.filter((a) => a.status === 'Absent').length
  const attendanceRate =
    totalSessions > 0 ? Math.round(((presentSessions + lateSessions * 0.5) / totalSessions) * 100) : 0

  // Weekly attendance roster & historic week navigation
  const [weekOffset, setWeekOffset] = useState(0)

  const { weekDays, weekRangeLabel, isCurrentWeek, weekSummary } = useMemo(() => {
    const today = new Date()
    const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    targetDate.setDate(targetDate.getDate() + weekOffset * 7)

    const monday = getMonday(targetDate)
    const todayIso = formatDateIso(today)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const days = []
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      const dateStr = formatDateIso(current)
      const record = attendance.find((a) => a.sessionDate === dateStr)

      days.push({
        dateStr,
        dayName: dayNames[i],
        dayNumber: current.getDate(),
        isToday: dateStr === todayIso,
        isFuture: dateStr > todayIso,
        record,
      })
    }

    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
    const weekRangeLabel = `${formatShortDate(monday)} – ${formatFullDate(sunday)}`
    const isCurrentWeek = weekOffset === 0

    const loggedInWeek = days.map((d) => d.record).filter(Boolean)
    const presentInWeek = loggedInWeek.filter((r) => r?.status === 'Present').length
    const lateInWeek = loggedInWeek.filter((r) => r?.status === 'Late').length
    const absentInWeek = loggedInWeek.filter((r) => r?.status === 'Absent').length

    return {
      weekDays: days,
      weekRangeLabel,
      isCurrentWeek,
      weekSummary: {
        total: loggedInWeek.length,
        present: presentInWeek,
        late: lateInWeek,
        absent: absentInWeek,
      },
    }
  }, [attendance, weekOffset])

  // Assessment metrics
  const totalEvaluations = assessments.length
  const avgScore =
    totalEvaluations > 0
      ? Math.round(
          assessments.reduce((acc, curr) => acc + (curr.score / (curr.maxScore || 100)) * 100, 0) / totalEvaluations,
        )
      : 0
  const passedEvaluations = assessments.filter((a) => (a.score / (a.maxScore || 100)) * 100 >= 50).length

  return (
    <div className="space-y-8 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span>Back to Students Roster</span>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
            <Printer size={15} />
            <span className="ml-1.5 hidden sm:inline">Print Profile</span>
          </Button>
          {balance === 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={onCertificate}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileCheck2 size={15} />
              <span className="ml-1.5">Certificate</span>
            </Button>
          )}
        </div>
      </div>

      {/* Payment Success Celebration Banner */}
      {isPaymentSuccess && showSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <strong className="text-xs font-bold block text-emerald-950">Payment Recorded Successfully!</strong>
              <p className="text-xs text-emerald-800">
                {successInvoice
                  ? `Verified tax invoice #${successInvoice} has been issued and posted to the financial ledger.`
                  : 'Fee installment has been successfully credited to this student account.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {successInvoice && onInvoice && (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  onInvoice({
                    id: successInvoice,
                    student: student.name,
                    method: 'Ledger',
                    date: new Date().toLocaleDateString('en-IN'),
                    amount: 0,
                    invoice: successInvoice,
                    studentId: student.registerId,
                  })
                }
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Receipt size={14} className="mr-1.5" />
                <span>View Invoice</span>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setShowSuccessBanner(false)}
              className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-600 cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Student Profile Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-xs tracking-wider">
              {student.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{student.name}</h1>

              <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 mt-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  TAI-{student.registerId}
                </span>
                <Status status={student.status} />
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-slate-800">{student.course}</span>
                {categoryName && <CategoryBadge categoryName={categoryName} duration={courseDuration} />}
                <span>•</span>
                <span>Batch started {student.batch}</span>
              </div>
            </div>
          </div>

          {!isStaff && canRecordPayment && balance > 0 && (
            <Link
              href={`/invoices/record?studentId=${student.registerId}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors shrink-0"
            >
              <CircleDollarSign size={16} />
              <span>Record Payment</span>
              <span className="bg-emerald-700 px-1.5 py-0.5 rounded text-[10px]">Due {money(balance)}</span>
            </Link>
          )}
        </div>

        {/* Contact & Personal Information Details Grid */}
        <div className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                <Phone size={13} className="text-slate-500" /> Primary Phone
              </span>
              <strong className="text-slate-900 font-mono text-sm block">
                {student.phone ? (
                  <a href={`tel:+91${student.phone}`} className="hover:text-indigo-600 transition-colors">
                    +91 {student.phone}
                  </a>
                ) : (
                  '—'
                )}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                <Phone size={13} className="text-slate-500" /> Alternate Phone
              </span>
              <strong className="text-slate-900 font-mono text-sm block">
                {student.altPhone ? (
                  <a href={`tel:+91${student.altPhone}`} className="hover:text-indigo-600 transition-colors">
                    +91 {student.altPhone}
                  </a>
                ) : (
                  <span className="text-slate-500 font-mono font-normal">—</span>
                )}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                <Mail size={13} className="text-slate-500" /> Email Address
              </span>
              <strong className="text-slate-900 truncate block">
                {student.email ? (
                  <a
                    href={`mailto:${student.email}`}
                    className="hover:text-indigo-600 transition-colors"
                    title={student.email}
                  >
                    {student.email}
                  </a>
                ) : (
                  <span className="text-slate-500 font-normal">—</span>
                )}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" /> Date of Birth
              </span>
              <strong className="text-slate-900 block">{student.dob || '—'}</strong>
            </div>

            <div>
              <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                <MapPin size={13} className="text-slate-500" /> Location
              </span>
              <strong
                className="text-slate-900 block truncate"
                title={[student.area, student.city, student.state].filter(Boolean).join(', ') || 'Tamil Nadu, India'}
              >
                {[student.area, student.city, student.state].filter(Boolean).join(', ') || 'Tamil Nadu, India'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                <User size={13} className="text-slate-500" /> Gender / Status
              </span>
              <strong className="text-slate-900 block">
                {[student.gender, student.maritalStatus].filter(Boolean).join(' · ') || 'Student'}
              </strong>
            </div>

            {!isStaff && (
              <div>
                <span className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                  <Compass size={13} className="text-slate-500" /> Source
                </span>
                <strong
                  className="text-slate-900 block truncate"
                  title={student.studentSource || (student as any).leadSource || 'Direct Walk-in'}
                >
                  {student.studentSource || (student as any).leadSource || 'Direct Walk-in'}
                </strong>
              </div>
            )}
          </div>

          {((student.knowledgeTags && student.knowledgeTags.length > 0) || student.comments) && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-start justify-between text-xs">
              {student.knowledgeTags && student.knowledgeTags.length > 0 && (
                <div className="flex-1">
                  <span className="text-slate-500 font-medium block mb-1.5">Knowledge & Skill Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.knowledgeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {student.comments && (
                <div className="flex-1">
                  <span className="text-slate-500 font-medium block mb-1.5">Counselor Remarks:</span>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    &ldquo;{student.comments}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── FEE SUMMARY & PAYMENT HISTORY ─── */}
      {!isStaff && (
        <section aria-labelledby="section-fees-heading" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <h2 id="section-fees-heading" className="text-base font-bold text-slate-900 tracking-tight">
                  Fee Summary & Payment History
                </h2>
                <p className="text-xs text-slate-500">Live account balance, installment milestones, and tax invoices</p>
              </div>
            </div>

            {canRecordPayment && balance > 0 && (
              <Link
                href={`/invoices/record?studentId=${student.registerId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors shrink-0"
              >
                <CircleDollarSign size={15} />
                <span>Record Payment</span>
              </Link>
            )}
          </div>

          {/* Fee Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Hero Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Account Balance
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Live Fee Status</h3>
                  </div>
                  <Status status={student.status} />
                </div>

                <div className="py-4 text-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    {balance === 0 ? 'All Fees Cleared' : 'Outstanding Dues'}
                  </span>
                  <div className={`text-3xl font-extrabold ${balance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {money(balance)}
                  </div>

                  <div className="mt-4 px-2">
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentageOfRupees(student.paid, student.total)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
                      <span>
                        Paid: <strong className="text-slate-900">{money(student.paid)}</strong>
                      </span>
                      <span>
                        Total: <strong className="text-slate-900">{money(student.total)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Info & Action Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Ledger Overview
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Financial Status</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    GST Rate: {gstRate}%
                  </span>
                </div>

                <div className="py-3 text-xs space-y-2.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Curriculum Course:</span>
                    <strong className="text-slate-900 font-semibold">{student.course}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Recorded Payments:</span>
                    <strong className="text-slate-900 font-semibold">
                      {history.length} installment{history.length === 1 ? '' : 's'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Settlement Progress:</span>
                    <strong className="text-emerald-700 font-semibold">
                      {percentageOfRupees(student.paid, student.total)}% Complete
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                {canRecordPayment && balance > 0 ? (
                  <Link
                    href={`/invoices/record?studentId=${student.registerId}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    <CircleDollarSign size={16} />
                    <span>Record Payment ({money(balance)} Due)</span>
                    <ArrowRight size={14} className="ml-1" />
                  </Link>
                ) : balance === 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 flex-wrap text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Account settled in full</span>
                      <span className="text-emerald-400 font-normal">•</span>
                      <span className="text-emerald-700 font-medium">Eligible for certificate</span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onCertificate}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                    >
                      <FileCheck2 size={14} className="mr-1.5" />
                      Generate Certificate
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No outstanding actions required.</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="panel mt-4">
            <div className="panel-header">
              <div>
                <h2>Payment history</h2>
                <p>
                  {history.length} payment{history.length === 1 ? '' : 's'} · Most recent first
                </p>
              </div>
              {canRecordPayment && balance > 0 && (
                <Link
                  href={`/invoices/record?studentId=${student.registerId}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs font-semibold' })}
                >
                  <CircleDollarSign size={14} className="mr-1.5 text-emerald-600" />
                  Record Payment
                </Link>
              )}
            </div>
            <PaymentsTable payments={history} onInvoice={onInvoice} />
          </div>
        </section>
      )}

      {/* ─── CLASSROOM ATTENDANCE ─── */}
      <section aria-label="Classroom Attendance" className="space-y-4">
        <div className="panel p-6 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CalendarCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Attendance Metrics</h3>
                <p className="text-xs text-slate-500">Live roster records for {student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
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
              <Link
                href={`/attendance?search=${encodeURIComponent(student.name)}`}
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs font-semibold' })}
              >
                <CalendarCheck size={14} className="mr-1.5 text-emerald-600" />
                <span>Open Attendance Roster</span>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Rate</span>
              <strong
                className={`text-2xl font-bold mt-0.5 block ${
                  attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 70 ? 'text-amber-600' : 'text-rose-600'
                }`}
              >
                {totalSessions > 0 ? `${attendanceRate}%` : 'N/A'}
              </strong>
              <span className="text-[10px] text-slate-500 font-medium">Weighted presence</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Present</span>
              <strong className="text-2xl font-bold text-emerald-700 mt-0.5 block">{presentSessions}</strong>
              <span className="text-[10px] text-emerald-600 font-medium">Full sessions</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Late</span>
              <strong className="text-2xl font-bold text-amber-700 mt-0.5 block">{lateSessions}</strong>
              <span className="text-[10px] text-amber-600 font-medium">0.5 credit</span>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Absent</span>
              <strong className="text-2xl font-bold text-rose-700 mt-0.5 block">{absentSessions}</strong>
              <span className="text-[10px] text-rose-600 font-medium">Missed sessions</span>
            </div>
          </div>

          {/* Weekly Attendance Schedule & Historic Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Roster</h4>
                {isCurrentWeek ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Current Week
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer"
                  >
                    Jump to Current Week
                  </button>
                )}
              </div>

              {/* Historic Week Navigation */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={14} className="mr-0.5" />
                  <span>Prev</span>
                </Button>

                <span className="text-xs font-semibold text-slate-800 font-mono px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                  {weekRangeLabel}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  disabled={weekOffset >= 4}
                  className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Next week"
                >
                  <span>Next</span>
                  <ChevronRight size={14} className="ml-0.5" />
                </Button>
              </div>
            </div>

            {/* 7-Day Week Calendar Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weekDays.map((day) => {
                const att = day.record
                return (
                  <div
                    key={day.dateStr}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between min-h-[96px] transition-all ${
                      day.isToday
                        ? 'border-indigo-300 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                        : 'border-slate-200/80 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 pb-1">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">{day.dayName}</span>
                        <span className="font-mono text-xs font-bold text-slate-900 block">{day.dateStr.slice(5)}</span>
                      </div>
                      {day.isToday && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white tracking-wider">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="pt-2">
                      {att ? (
                        <span
                          className={`inline-flex items-center gap-1 w-full justify-center px-2 py-1 rounded-md text-[11px] font-bold border ${
                            att.status === 'Present'
                              ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200'
                              : att.status === 'Late'
                                ? 'bg-amber-100/90 text-amber-800 border-amber-200'
                                : att.status === 'Absent'
                                  ? 'bg-rose-100/90 text-rose-800 border-rose-200'
                                  : 'bg-indigo-100/90 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {att.status === 'Present' && <CheckCircle2 size={12} className="shrink-0" />}
                          {att.status === 'Late' && <Clock size={12} className="shrink-0" />}
                          {att.status === 'Absent' && <XCircle size={12} className="shrink-0" />}
                          <span>{att.status}</span>
                        </span>
                      ) : day.isFuture ? (
                        <span className="text-[11px] text-slate-400 font-medium italic block text-center py-1">
                          Upcoming
                        </span>
                      ) : day.dayName === 'Sun' ? (
                        <span className="text-[11px] text-slate-400 font-medium block text-center py-1">Weekend</span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium block text-center py-1">
                          No Session
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Week Summary Bar */}
            {weekSummary.total > 0 ? (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span>
                    Logged this week: <strong className="text-slate-900">{weekSummary.total} sessions</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-semibold">{weekSummary.present} Present</span>
                  {weekSummary.late > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-amber-700 font-semibold">{weekSummary.late} Late</span>
                    </>
                  )}
                  {weekSummary.absent > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-700 font-semibold">{weekSummary.absent} Absent</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {Math.round(((weekSummary.present + weekSummary.late * 0.5) / weekSummary.total) * 100)}% weekly
                  attendance
                </span>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400 italic py-1">
                No attendance sessions recorded for this week ({weekRangeLabel}).
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── ACADEMIC ASSESSMENTS & MATERIALS ─── */}
      <section aria-label="Academic Assessments & Materials" className="space-y-4">
        <div className="panel p-6 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Academic Assessments</h3>
                <p className="text-xs text-slate-500">Evaluations, test scores, & grades</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalEvaluations > 0 ? `${avgScore}% Average` : 'No tests yet'}
              </span>
              <Link
                href={`/assessments?search=${encodeURIComponent(student.name)}`}
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs font-semibold' })}
              >
                <Award size={14} className="mr-1.5 text-indigo-600" />
                <span>Enter Assessment Score</span>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Average</span>
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
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Evaluated Assessments</h4>
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

        {/* Course Curriculum & Learning Materials Banner */}
        <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Curriculum Learning Materials</h4>
              <p className="text-xs text-slate-600">
                Access slide decks, code snippets, and handouts for {student.course}.
              </p>
            </div>
          </div>
          <Link
            href="/materials"
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs bg-white shrink-0' })}
          >
            Browse Materials
            <ArrowUpRight size={13} className="ml-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}
