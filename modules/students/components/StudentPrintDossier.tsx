'use client'

import { useEffect, useState } from 'react'
import type { Course, Payment, Student } from '@/lib/types'
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

interface StudentPrintDossierProps {
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
    <div className="student-dossier-print-root bg-white text-slate-900 text-[11px] leading-relaxed max-w-[210mm] mx-auto p-8 font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER: INSTITUTIONAL BRAND & DOSSIER METADATA
         ═══════════════════════════════════════════════════════════════════════════ */}
      <header className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
              TAI
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">{brand.legalName}</h1>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                Comprehensive Student Academic &amp; Financial Dossier
              </p>
              <p className="text-[9px] text-slate-500">{brand.tagline} · Official Transcript &amp; Training Records</p>
            </div>
          </div>

          <div className="text-right text-[10px] space-y-0.5 font-mono">
            <div className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block font-bold text-slate-900">
              REG ID: TAI-{student.registerId}
            </div>
            <div className="text-slate-500">Date Issued: {printedAt}</div>
            <div className="text-slate-500">
              Doc Ref: DOS-{currentYear}-{student.registerId}
            </div>
            <div className="font-semibold text-slate-800">
              {isSettled ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Fully Cleared
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Balance Due: {money(balance)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 1: STUDENT PROFILE & DEMOGRAPHICS
         ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="student-dossier-avoid-break mb-6">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={15} className="text-slate-700" />
              Section 1: Student Identity &amp; Enrollment Details
            </h2>
            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {categoryName ? `${categoryName} Tier` : 'Essential'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-6 gap-y-2.5 text-[10px]">
            <div>
              <span className="text-slate-500 block uppercase font-medium">Student Full Name</span>
              <strong className="text-slate-950 text-xs font-bold block">{student.name}</strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Enrolled Course</span>
              <strong className="text-slate-950 font-bold block">{student.course}</strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Course Duration &amp; Tier</span>
              <strong className="text-slate-900 block">
                {courseDuration || '6 weeks'} · {categoryName || 'Essential'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Primary Contact Phone</span>
              <strong className="text-slate-900 font-mono block">+91 {student.phone}</strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Alternate Contact Phone</span>
              <strong className="text-slate-900 font-mono block">
                {student.altPhone ? `+91 ${student.altPhone}` : '—'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Email Address</span>
              <strong className="text-slate-900 block truncate">{student.email || '—'}</strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Date of Birth</span>
              <strong className="text-slate-900 block">{formatDate(student.dob)}</strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Gender &amp; Marital Status</span>
              <strong className="text-slate-900 block">
                {[student.gender, student.maritalStatus].filter(Boolean).join(' · ') || 'Student'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Admission Source</span>
              <strong className="text-slate-900 block">
                {student.studentSource || (student as any).leadSource || 'Direct Walk-in'}
              </strong>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 block uppercase font-medium">Residential Location</span>
              <strong className="text-slate-900 block">
                {[student.area, student.city, student.state, student.country].filter(Boolean).join(', ') ||
                  'Tamil Nadu, India'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-medium">Batch Commenced</span>
              <strong className="text-slate-900 font-mono block">{student.batch}</strong>
            </div>
          </div>

          {/* Tags & Counselor Remarks */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-start gap-4">
            <div className="flex-1">
              <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">
                Knowledge &amp; Skill Competencies
              </span>
              <div className="flex flex-wrap gap-1">
                {student.knowledgeTags && student.knowledgeTags.length > 0 ? (
                  student.knowledgeTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[9px] font-semibold border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[9px]">Web Technologies, Practical Labs</span>
                )}
              </div>
            </div>

            {student.comments && (
              <div className="flex-1">
                <span className="text-slate-500 block text-[9px] uppercase font-bold mb-0.5">
                  Academic Counselor Remarks
                </span>
                <p className="text-slate-700 italic text-[10px] bg-white p-1.5 rounded border border-slate-200">
                  &ldquo;{student.comments}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 2: FINANCIAL STATEMENT & PAYMENT INVOICES
         ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="student-dossier-avoid-break mb-6">
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CircleDollarSign size={15} className="text-emerald-700" />
              Section 2: Fee Structure &amp; Recorded Invoices
            </h2>
            <span className="text-[10px] font-mono text-slate-600">Applicable GST: {gstRate}% Included</span>
          </div>

          {/* 4 Financial KPI Blocks */}
          <div className="grid grid-cols-4 gap-3 mb-4 text-center">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Course Fee</span>
              <strong className="text-sm font-bold text-slate-950 font-mono block mt-0.5">
                {money(student.total)}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <span className="text-[9px] uppercase font-bold text-emerald-800 block">Total Amount Paid</span>
              <strong className="text-sm font-bold text-emerald-700 font-mono block mt-0.5">
                {money(student.paid)}
              </strong>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isSettled ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/60 border-rose-200'
              }`}
            >
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Balance Outstanding</span>
              <strong
                className={`text-sm font-bold font-mono block mt-0.5 ${isSettled ? 'text-slate-900' : 'text-rose-700'}`}
              >
                {money(balance)}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Clearance Status</span>
              <strong className="text-xs font-bold text-slate-900 block mt-1">
                {isSettled ? (
                  <span className="text-emerald-700 font-bold">100% Settled</span>
                ) : (
                  <span>{percentageOfRupees(student.paid, student.total)}% Paid</span>
                )}
              </strong>
            </div>
          </div>

          {/* Invoices Table */}
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 uppercase font-bold">
                <th className="py-1.5 px-2 font-mono">Invoice / Receipt #</th>
                <th className="py-1.5 px-2">Date</th>
                <th className="py-1.5 px-2">Payment Milestone</th>
                <th className="py-1.5 px-2">Method</th>
                <th className="py-1.5 px-2 font-mono">Reference #</th>
                <th className="py-1.5 px-2 text-right">Amount (₹)</th>
                <th className="py-1.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length > 0 ? (
                history.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td className="py-1.5 px-2 font-mono font-bold text-slate-900">
                      {p.invoice || `INV-TAI-${p.studentId}-${idx + 1}`}
                    </td>
                    <td className="py-1.5 px-2 text-slate-700 font-mono">{formatDate(p.date)}</td>
                    <td className="py-1.5 px-2 font-medium text-slate-800">
                      {p.paymentType || `Installment ${idx + 1}`}
                    </td>
                    <td className="py-1.5 px-2 text-slate-600">{p.method || 'Online'}</td>
                    <td className="py-1.5 px-2 text-slate-500 font-mono text-[9px]">{p.transactionId || 'PROV-REF'}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">{money(p.amount)}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-slate-400 italic">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-50 text-[10px]">
              <tr>
                <td colSpan={5} className="py-1.5 px-2 text-slate-700 uppercase">
                  Total Fees Settled
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-emerald-700">{money(student.paid)}</td>
                <td className="py-1.5 px-2 text-center font-mono text-[9px] text-slate-500">
                  {history.length} Receipts
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 3: CLASSROOM ATTENDANCE RECORD (ALL SESSIONS)
         ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="student-dossier-avoid-break mb-6">
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck size={15} className="text-indigo-700" />
              Section 3: Classroom Attendance Record ({attendance.length} Total Sessions)
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-emerald-700">{presentSessions} Present</span>
              <span className="text-slate-300">·</span>
              <span className="text-amber-700">{lateSessions} Late</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-700">{absentSessions} Absent</span>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-slate-900 font-mono">{attendanceRate}% Rate</span>
            </div>
          </div>

          {attendance.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 text-[9px]">
              {attendance.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-1.5 rounded border border-slate-200/90 bg-slate-50/50"
                >
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-900">{att.sessionDate}</span>
                    <span className="text-slate-500 text-[8px] uppercase">({getDayOfWeek(att.sessionDate)})</span>
                  </div>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[9px] border ${
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
          ) : (
            <p className="text-slate-400 italic text-center py-2 text-[10px]">
              No individual attendance sessions recorded yet.
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 4: ACADEMIC ASSESSMENTS & MARKS
         ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="student-dossier-avoid-break mb-6">
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={15} className="text-violet-700" />
              Section 4: Academic Assessments &amp; Examination Records
            </h2>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-slate-600 font-medium">
                Evaluated: <strong>{totalEvaluations} Tests</strong>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-700 font-bold font-mono">Average Score: {avgScore}%</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-[10px]">
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
                  const grade = pct >= 85 ? 'Distinction' : pct >= 70 ? 'First Class' : pct >= 50 ? 'Pass' : 'Remedial'
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
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
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
                        {a.remarks || 'Competencies verified and demonstrated satisfactorily.'}
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
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 5: OFFICIAL COURSE COMPLETION CERTIFICATE
          (Page break to render cleanly on its own dedicated A4 page)
         ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="student-dossier-page-break pt-4 mb-6">
        <div className="relative border-4 border-double border-amber-600/70 rounded-2xl p-8 bg-[#fffdf8] text-slate-900 shadow-xs">
          {/* Inner Ornate Gold Border */}
          <div className="border border-amber-500/40 rounded-xl p-6 text-center relative">
            {/* Top Emblem */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center border-2 border-amber-400 shadow-xs">
                <FileCheck2 size={26} />
              </div>
            </div>

            <p className="text-[10px] font-bold tracking-[0.25em] text-amber-800 uppercase mb-1">{brand.legalName}</p>
            <h2 className="text-2xl font-serif font-bold text-slate-950 tracking-tight uppercase mb-1">
              Certificate of Completion
            </h2>
            <p className="text-[10px] text-slate-600 italic mb-6">This document officially certifies that</p>

            <h3 className="text-2xl font-serif font-extrabold text-slate-950 tracking-wide border-b-2 border-amber-700/60 pb-2 mb-4 max-w-md mx-auto">
              {student.name}
            </h3>

            <p className="text-[10px] text-slate-700 leading-relaxed max-w-lg mx-auto mb-2">
              has successfully fulfilled all curriculum requirements, classroom practical sessions, and academic
              benchmarks for the professional training program in
            </p>

            <h4 className="text-base font-bold text-indigo-950 tracking-tight mb-2">{student.course}</h4>

            <div className="flex justify-center items-center gap-3 text-[10px] text-slate-600 mb-6 font-mono">
              <span>Batch Commenced: {student.batch}</span>
              <span>•</span>
              <span>
                Category: {categoryName || 'Essential'} Tier ({courseDuration || '6 weeks'})
              </span>
              <span>•</span>
              <span>Certificate ID: {certId}</span>
            </div>

            {/* Verification & Signatures */}
            <div className="grid grid-cols-3 items-end pt-6 border-t border-amber-600/30">
              {/* Director Signature */}
              <div className="text-center">
                <div className="h-10 border-b border-slate-900 max-w-[140px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic text-xs font-bold text-slate-800">K. Subramanian</span>
                </div>
                <strong className="block text-[10px] font-bold text-slate-950 mt-1">Dr. K. Subramanian</strong>
                <span className="text-[9px] text-slate-500 uppercase">Director &amp; Registrar</span>
              </div>

              {/* QR Code & Official Seal */}
              <div className="flex flex-col items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Certificate Verification QR"
                    className="w-16 h-16 border border-slate-200 rounded p-0.5 bg-white mb-1"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-[8px] uppercase tracking-wider mb-1">
                    SEAL
                  </div>
                )}
                <span className="text-[8px] font-mono text-slate-500 text-center">Verify: {certId}</span>
              </div>

              {/* Lead Trainer Signature */}
              <div className="text-center">
                <div className="h-10 border-b border-slate-900 max-w-[140px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic text-xs font-bold text-slate-800">A. Ravichandran</span>
                </div>
                <strong className="block text-[10px] font-bold text-slate-950 mt-1">A. Ravichandran</strong>
                <span className="text-[9px] text-slate-500 uppercase">Head Technical Trainer</span>
              </div>
            </div>

            {!isSettled && (
              <div className="mt-4 p-2 bg-amber-50 border border-amber-300 rounded text-center text-[9px] text-amber-900 font-medium">
                * Note: Final official printed parchment certificate is subject to fee clearance (Balance Outstanding:{' '}
                {money(balance)}).
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 6: INSTITUTIONAL ENDORSEMENT & SECURITY STATEMENT
         ═══════════════════════════════════════════════════════════════════════════ */}
      <footer className="student-dossier-avoid-break border-t border-slate-300 pt-3 text-[9px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>
            Verified from Official Institutional Records · {brand.displayName} · {brand.supportEmail}
          </span>
        </div>
        <div className="text-right font-mono">Page Verified · Ref: DOS-TAI-{student.registerId}</div>
      </footer>
    </div>
  )
}
