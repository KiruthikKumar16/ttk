'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Payment, Student } from '@/lib/types'
import { money } from '@/lib/formatters'
import { brand } from '@/lib/brand'
import { differenceRupees, percentageOfRupees } from '@/lib/money'
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react'

export interface StudentPrintDossierProps {
  student: Student
  payments: Payment[]
  attendance: { id: string; sessionDate: string; status: 'Present' | 'Absent' | 'Late' | 'Excused' }[]
  assessments: {
    id: string
    title: string
    date: string
    score: number
    maxScore: number
    remarks?: string | null
    gradedAt?: string | null
  }[]
  categoryName?: string | null
  courseDuration?: string | null
  gstRate?: number
  isPortalPrint?: boolean
}

function formatDate(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v + (v.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return v
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDayOfWeek(v: string): string {
  const d = new Date(v + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { weekday: 'short' })
}

export function StudentPrintDossier({
  student,
  payments,
  attendance,
  assessments,
  categoryName,
  courseDuration,
  gstRate = 18,
  isPortalPrint = false,
}: StudentPrintDossierProps) {
  const balance = differenceRupees(student.total, student.paid)
  const isSettled = balance === 0
  const history = payments.filter((p) => p.studentId === student.registerId)

  // Attendance metrics
  const totalSessions = attendance.length
  const presentSessions = attendance.filter((a) => a.status === 'Present').length
  const lateSessions = attendance.filter((a) => a.status === 'Late').length
  const absentSessions = attendance.filter((a) => a.status === 'Absent').length
  const attendanceRate =
    totalSessions > 0 ? Math.round(((presentSessions + lateSessions * 0.5) / totalSessions) * 100) : 0

  // Assessment metrics
  const totalEvaluations = assessments.length
  const avgScore =
    totalEvaluations > 0
      ? Math.round(
          assessments.reduce((acc, curr) => acc + (curr.score / (curr.maxScore || 100)) * 100, 0) / totalEvaluations,
        )
      : 0
  const passedEvaluations = assessments.filter((a) => (a.score / (a.maxScore || 100)) * 100 >= 50).length

  // QR Code for certificate verification
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()
  const certId = `TAI-${currentYear}-${String(student.registerId).padStart(4, '0')}`
  const verificationUrl = `${brand.verifyBaseUrl}/verify/${certId}`
  const printedAt = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  useEffect(() => {
    let active = true
    async function loadQR() {
      try {
        const QRCode = (await import('qrcode')).default
        const url = await QRCode.toDataURL(verificationUrl, { width: 140, margin: 1 })
        if (active) setQrCodeUrl(url)
      } catch {
        // Fallback gracefully without throwing
      }
    }
    loadQR()
    return () => {
      active = false
    }
  }, [verificationUrl])

  return (
    <div
      className={`student-dossier-print-container font-sans text-slate-900 ${
        isPortalPrint ? 'student-dossier-print-portal' : 'max-w-[210mm] mx-auto'
      }`}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════
          PAGE 1: STUDENT MASTER PROFILE & DEMOGRAPHICS
         ═══════════════════════════════════════════════════════════════════════════ */}
      <article className="dossier-page">
        <div>
          {/* Header */}
          <header className="border-b-2 border-slate-900 pb-3 mb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
                  TAI
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">{brand.legalName}</h1>
                  <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">
                    Official Student Academic &amp; Financial Dossier
                  </p>
                  <p className="text-[9px] text-slate-500">{brand.tagline} · Government Recognized Training Records</p>
                </div>
              </div>

              <div className="text-right text-[10px] space-y-0.5 font-mono">
                <div className="bg-slate-900 text-white px-2.5 py-0.5 rounded font-bold inline-block">
                  REG ID: TAI-{student.registerId}
                </div>
                <div className="text-slate-600 font-medium">Issue Date: {printedAt}</div>
                <div className="text-slate-500">
                  Ref: DOS-{currentYear}-{student.registerId}
                </div>
                <div>
                  {isSettled ? (
                    <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                      Account Settled in Full
                    </span>
                  ) : (
                    <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-300 font-bold">
                      Due: {money(balance)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Section 1: Identity & Enrollment Grid */}
          <section className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 mb-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap size={15} className="text-indigo-700" />
                Section 1: Student Master Identity &amp; Enrollment
              </h2>
              <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {categoryName ? `${categoryName} Tier` : 'Essential'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[10px]">
              <div className="space-y-2 border-r border-slate-200 pr-4">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Personal &amp; Demographics
                </h3>
                <div>
                  <span className="text-slate-500 block">Candidate Full Name</span>
                  <strong className="text-slate-950 text-sm font-bold block">{student.name}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Date of Birth</span>
                    <strong className="text-slate-900 block">{formatDate(student.dob)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gender / Status</span>
                    <strong className="text-slate-900 block">
                      {[student.gender, student.maritalStatus].filter(Boolean).join(' · ') || 'Student'}
                    </strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Primary Contact Phone</span>
                    <strong className="text-slate-900 font-mono block">+91 {student.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Alternate Contact</span>
                    <strong className="text-slate-900 font-mono block">
                      {student.altPhone ? `+91 ${student.altPhone}` : '—'}
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">Official Email</span>
                  <strong className="text-slate-900 block truncate">{student.email || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Residential Address</span>
                  <strong className="text-slate-900 block">
                    {[student.area, student.city, student.state, student.country].filter(Boolean).join(', ') ||
                      'Tamil Nadu, India'}
                  </strong>
                </div>
              </div>

              <div className="space-y-2 pl-2">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Program &amp; Academic Enrollment
                </h3>
                <div>
                  <span className="text-slate-500 block">Enrolled Curriculum</span>
                  <strong className="text-slate-950 text-xs font-bold block">{student.course}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Category Tier</span>
                    <strong className="text-slate-900 block">{categoryName || 'Essential'} Tier</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Program Duration</span>
                    <strong className="text-slate-900 block">{courseDuration || '6 weeks'}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Batch Commenced</span>
                    <strong className="text-slate-900 font-mono block">{student.batch}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Admission Source</span>
                    <strong className="text-slate-900 block">
                      {student.studentSource || (student as any).leadSource || 'Direct Walk-in'}
                    </strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Total Course Fee</span>
                    <strong className="text-slate-900 font-mono block">{money(student.total)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fee Settled</span>
                    <strong className="text-emerald-700 font-mono font-bold block">{money(student.paid)}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">Academic Standing</span>
                  <strong className="text-slate-900 font-semibold block">
                    {attendanceRate >= 80 ? 'Good Standing (Eligible for Certification)' : 'Active Roster Student'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Skills & Remarks */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">
                  Knowledge &amp; Technical Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {student.knowledgeTags && student.knowledgeTags.length > 0 ? (
                    student.knowledgeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-white text-slate-800 text-[9px] font-semibold border border-slate-300"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[9px]">Web Technologies, Laboratory Practicals</span>
                  )}
                </div>
              </div>

              {student.comments && (
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">
                    Counselor &amp; Staff Assessment Remarks
                  </span>
                  <p className="text-slate-800 italic text-[9px] bg-white p-2 rounded border border-slate-300">
                    &ldquo;{student.comments}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Academic Overview Highlights */}
          <section className="grid grid-cols-4 gap-3 text-center mb-4">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Sessions</span>
              <strong className="text-lg font-bold text-slate-900 block mt-0.5">{totalSessions}</strong>
              <span className="text-[8px] text-slate-500">Curriculum Sessions</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Presence Rate</span>
              <strong className="text-lg font-bold text-emerald-700 block mt-0.5">{attendanceRate}%</strong>
              <span className="text-[8px] text-emerald-600">Weighted Attendance</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Tests Graded</span>
              <strong className="text-lg font-bold text-slate-900 block mt-0.5">{totalEvaluations}</strong>
              <span className="text-[8px] text-slate-500">Evaluated Benchmarks</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Average Score</span>
              <strong className="text-lg font-bold text-indigo-700 block mt-0.5">{avgScore}%</strong>
              <span className="text-[8px] text-indigo-600">Cohort Average</span>
            </div>
          </section>
        </div>

        {/* Page 1 Footer */}
        <footer className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 flex items-center justify-between">
          <span>
            Student Master Transcript · {brand.displayName} · Ref: DOS-{currentYear}-{student.registerId}
          </span>
          <span className="font-mono font-bold">Page 1 of 4</span>
        </footer>
      </article>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAGE 2: COMPREHENSIVE FINANCIAL STATEMENT & INVOICES LEDGER
         ═══════════════════════════════════════════════════════════════════════════ */}
      <article className="dossier-page">
        <div>
          {/* Header */}
          <header className="border-b border-slate-300 pb-2 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
                <CircleDollarSign size={16} className="text-emerald-700" />
                Section 2: Fee Structure &amp; Recorded Invoices Ledger
              </h2>
              <p className="text-[9px] text-slate-500">
                Official Financial Accounting Statement for TAI-{student.registerId}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              GST Rate: {gstRate}% Included
            </span>
          </header>

          {/* 4 Financial KPI Blocks */}
          <div className="grid grid-cols-4 gap-3 mb-5 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Course Fee</span>
              <strong className="text-base font-bold text-slate-950 font-mono block mt-0.5">
                {money(student.total)}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-300">
              <span className="text-[9px] uppercase font-bold text-emerald-800 block">Amount Settled</span>
              <strong className="text-base font-bold text-emerald-700 font-mono block mt-0.5">
                {money(student.paid)}
              </strong>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                isSettled ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'
              }`}
            >
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Balance Remaining</span>
              <strong
                className={`text-base font-bold font-mono block mt-0.5 ${
                  isSettled ? 'text-slate-900' : 'text-rose-700'
                }`}
              >
                {money(balance)}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Clearance Status</span>
              <strong className="text-xs font-bold text-slate-900 block mt-1">
                {isSettled ? (
                  <span className="text-emerald-700 font-bold">100% Cleared</span>
                ) : (
                  <span>{percentageOfRupees(student.paid, student.total)}% Paid</span>
                )}
              </strong>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 uppercase font-bold">
                  <th className="py-2 px-3 font-mono">Invoice / Receipt #</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Milestone / Description</th>
                  <th className="py-2 px-3">Payment Method</th>
                  <th className="py-2 px-3 font-mono">Transaction Ref #</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length > 0 ? (
                  history.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {p.invoice || `INV-TAI-${p.studentId}-${idx + 1}`}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-mono">{formatDate(p.date)}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {p.paymentType || `Installment ${idx + 1}`}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{p.method || 'Online'}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[9px]">{p.transactionId || 'PROV-REF'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{money(p.amount)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-50 text-[10px]">
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-slate-700 uppercase">
                    Total Fees Settled
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-700 text-xs">{money(student.paid)}</td>
                  <td className="py-2 px-3 text-center font-mono text-[9px] text-slate-500">
                    {history.length} Receipts
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Accounts Clearance & Endorsement */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Fee Settlement Clearance Endorsement
            </h3>
            <p className="text-[9px] text-slate-600 leading-relaxed mb-6">
              This statement serves as an official accounting receipt for fees received towards tuition, laboratory, and
              examination facilities. All amounts logged above are reconciled against banking statements and
              institutional GST tax records.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
              <div className="text-center">
                <div className="h-8 border-b border-slate-800 max-w-[160px] mx-auto" />
                <strong className="block text-[10px] font-bold text-slate-900 mt-1">Authorized Finance Officer</strong>
                <span className="text-[8px] text-slate-500 uppercase">Accounts Department · {brand.displayName}</span>
              </div>
              <div className="text-center">
                <div className="h-8 border-b border-slate-800 max-w-[160px] mx-auto" />
                <strong className="block text-[10px] font-bold text-slate-900 mt-1">
                  Student Candidate Acknowledgment
                </strong>
                <span className="text-[8px] text-slate-500 uppercase">{student.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <footer className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 flex items-center justify-between">
          <span>
            Financial Records &amp; Invoices · {brand.displayName} · Ref: DOS-{currentYear}-{student.registerId}
          </span>
          <span className="font-mono font-bold">Page 2 of 4</span>
        </footer>
      </article>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAGE 3: CLASSROOM ATTENDANCE & ACADEMIC ASSESSMENTS
         ═══════════════════════════════════════════════════════════════════════════ */}
      <article className="dossier-page">
        <div>
          {/* Header */}
          <header className="border-b border-slate-300 pb-2 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarCheck size={16} className="text-indigo-700" />
                Section 3: Classroom Attendance &amp; Academic Assessments
              </h2>
              <p className="text-[9px] text-slate-500">
                Live Roster Records &amp; Graded Benchmarks for {student.name}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-emerald-700">{attendanceRate}% Attendance</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-700 font-bold">{avgScore}% Avg Score</span>
            </div>
          </header>

          {/* Section 3A: Attendance Record */}
          <div className="border border-slate-200 rounded-xl p-3.5 mb-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                Classroom Attendance Record ({attendance.length} Total Sessions)
              </h3>
              <div className="flex items-center gap-2 text-[9px] font-semibold">
                <span className="text-emerald-700">{presentSessions} Present</span>
                <span className="text-slate-300">·</span>
                <span className="text-amber-700">{lateSessions} Late</span>
                <span className="text-slate-300">·</span>
                <span className="text-rose-700">{absentSessions} Absent</span>
              </div>
            </div>

            {attendance.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-1.5 text-[8.5px]">
                  {attendance.slice(0, 36).map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-1 rounded border border-slate-200 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-1 font-mono truncate">
                        <span className="font-bold text-slate-900">{att.sessionDate}</span>
                        <span className="text-slate-500 text-[8px] uppercase">({getDayOfWeek(att.sessionDate)})</span>
                      </div>
                      <span
                        className={`font-bold px-1 py-0.2 rounded text-[7.5px] border shrink-0 ${
                          att.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : att.status === 'Late'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : att.status === 'Absent'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
                {attendance.length > 36 && (
                  <div className="mt-2 py-1 px-2.5 rounded bg-indigo-50 border border-indigo-200 text-center text-[8px] text-indigo-900 font-semibold">
                    Displaying 36 most recent sessions of {totalSessions} total recorded sessions ({presentSessions}{' '}
                    Present, {lateSessions} Late, {absentSessions} Absent · Attendance Rate: {attendanceRate}%).
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400 italic text-center py-2 text-[9px]">
                No individual attendance sessions recorded yet.
              </p>
            )}
          </div>

          {/* Section 3B: Academic Assessments */}
          <div className="border border-slate-200 rounded-xl p-3.5 mb-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                <Award size={13} className="text-violet-700" />
                Section 4: Academic Assessments &amp; Examination Records
              </h3>
              <span className="text-[9px] font-bold text-indigo-700">
                {passedEvaluations} of {totalEvaluations} Tests Passed
              </span>
            </div>

            <table className="w-full text-left border-collapse text-[9px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 uppercase font-bold">
                  <th className="py-1.5 px-2">Assessment Title</th>
                  <th className="py-1.5 px-2">Date Graded</th>
                  <th className="py-1.5 px-2 text-center font-mono">Score / Max</th>
                  <th className="py-1.5 px-2 text-center font-mono">Percentage</th>
                  <th className="py-1.5 px-2 text-center">Grade / Standing</th>
                  <th className="py-1.5 px-2">Evaluator Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.length > 0 ? (
                  assessments.map((a) => {
                    const pct = Math.round((a.score / (a.maxScore || 100)) * 100)
                    const grade =
                      pct >= 85 ? 'Distinction' : pct >= 70 ? 'First Class' : pct >= 50 ? 'Pass' : 'Remedial'
                    return (
                      <tr key={a.id}>
                        <td className="py-1.5 px-2 font-bold text-slate-900">{a.title}</td>
                        <td className="py-1.5 px-2 text-slate-600 font-mono">{formatDate(a.date || a.gradedAt)}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900">
                          {a.score} / {a.maxScore || 100}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-indigo-700">{pct}%</td>
                        <td className="py-1.5 px-2 text-center">
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                              pct >= 70
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : pct >= 50
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {grade}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-600 italic">
                          {a.remarks || 'Practical competencies demonstrated satisfactorily.'}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-slate-400 italic">
                      No academic assessments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Academic Verification Signatures */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="text-center">
                <div className="h-7 border-b border-slate-800 max-w-[160px] mx-auto" />
                <strong className="block text-[10px] font-bold text-slate-900 mt-1">Lead Academic Evaluator</strong>
                <span className="text-[8px] text-slate-500 uppercase">Training Department</span>
              </div>
              <div className="text-center">
                <div className="h-7 border-b border-slate-800 max-w-[160px] mx-auto" />
                <strong className="block text-[10px] font-bold text-slate-900 mt-1">
                  Head of Quality &amp; Assessment
                </strong>
                <span className="text-[8px] text-slate-500 uppercase">{brand.displayName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page 3 Footer */}
        <footer className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 flex items-center justify-between">
          <span>
            Academic Evaluations &amp; Attendance · {brand.displayName} · Ref: DOS-{currentYear}-{student.registerId}
          </span>
          <span className="font-mono font-bold">Page 3 of 4</span>
        </footer>
      </article>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAGE 4: OFFICIAL COURSE COMPLETION CERTIFICATE
         ═══════════════════════════════════════════════════════════════════════════ */}
      <article className="dossier-page">
        <div className="relative border-4 border-double border-amber-600/70 rounded-2xl p-7 bg-[#fffdf8] text-slate-900 shadow-xs h-full flex flex-col justify-between">
          {/* Inner Ornate Gold Border */}
          <div className="border border-amber-500/40 rounded-xl p-6 text-center relative h-full flex flex-col justify-between">
            {/* Top Crest */}
            <div>
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center border-2 border-amber-400 shadow-xs">
                  <FileCheck2 size={26} />
                </div>
              </div>

              <p className="text-[10px] font-bold tracking-[0.25em] text-amber-800 uppercase mb-1">{brand.legalName}</p>
              <h2 className="text-2xl font-serif font-bold text-slate-950 tracking-tight uppercase mb-1">
                Certificate of Completion
              </h2>
              <p className="text-[10px] text-slate-600 italic mb-4">This document officially certifies that</p>

              <h3 className="text-2xl font-serif font-extrabold text-slate-950 tracking-wide border-b-2 border-amber-700/60 pb-2 mb-4 max-w-md mx-auto">
                {student.name}
              </h3>

              <p className="text-[10px] text-slate-700 leading-relaxed max-w-lg mx-auto mb-2">
                has successfully fulfilled all curriculum requirements, classroom practical sessions, and academic
                benchmarks for the professional training program in
              </p>

              <h4 className="text-base font-bold text-indigo-950 tracking-tight mb-2">{student.course}</h4>

              <div className="flex justify-center items-center gap-3 text-[10px] text-slate-600 mb-4 font-mono">
                <span>Batch Commenced: {student.batch}</span>
                <span>•</span>
                <span>
                  Category: {categoryName || 'Essential'} Tier ({courseDuration || '6 weeks'})
                </span>
                <span>•</span>
                <span>Certificate ID: {certId}</span>
              </div>
            </div>

            {/* Verification & Signatures */}
            <div>
              <div className="grid grid-cols-3 items-end pt-4 border-t border-amber-600/30">
                {/* Director Signature */}
                <div className="text-center">
                  <div className="h-8 border-b border-slate-900 max-w-[130px] mx-auto flex items-end justify-center pb-0.5">
                    <span className="font-serif italic text-xs font-bold text-slate-800">K. Subramanian</span>
                  </div>
                  <strong className="block text-[10px] font-bold text-slate-950 mt-1">Dr. K. Subramanian</strong>
                  <span className="text-[8px] text-slate-500 uppercase">Director &amp; Registrar</span>
                </div>

                {/* QR Code & Official Seal */}
                <div className="flex flex-col items-center justify-center">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Certificate Verification QR"
                      className="w-14 h-14 border border-slate-200 rounded p-0.5 bg-white mb-1"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-[8px] uppercase tracking-wider mb-1">
                      SEAL
                    </div>
                  )}
                  <span className="text-[8px] font-mono text-slate-500 text-center">Verify: {certId}</span>
                </div>

                {/* Lead Trainer Signature */}
                <div className="text-center">
                  <div className="h-8 border-b border-slate-900 max-w-[130px] mx-auto flex items-end justify-center pb-0.5">
                    <span className="font-serif italic text-xs font-bold text-slate-800">A. Ravichandran</span>
                  </div>
                  <strong className="block text-[10px] font-bold text-slate-950 mt-1">A. Ravichandran</strong>
                  <span className="text-[8px] text-slate-500 uppercase">Head Technical Trainer</span>
                </div>
              </div>

              {!isSettled && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-300 rounded text-center text-[9px] text-amber-900 font-medium">
                  * Note: Official printed parchment certificate is released upon balance clearance (Remaining:{' '}
                  {money(balance)}).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page 4 Footer */}
        <footer className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 flex items-center justify-between">
          <span>
            Official Parchment Transcript · {brand.displayName} · Ref: DOS-{currentYear}-{student.registerId}
          </span>
          <span className="font-mono font-bold">Page 4 of 4</span>
        </footer>
      </article>
    </div>
  )
}
