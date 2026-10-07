'use client'

import { notFound } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { brand } from '@/lib/brand'

export default function VerificationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [verificationResult, setVerificationResult] = useState<
    | {
        status: 'Valid'
        document_type?: 'certificate' | 'invoice' | string | null
        student_name?: string | null
        course_name?: string | null
        issue_date?: string | null
        invoice_number?: string | null
      }
    | { status: 'Invalid' }
  >({ status: 'Invalid' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const cleanCode = decodeURIComponent(code).trim()
        const res = await fetch(`/api/verify/${encodeURIComponent(cleanCode)}`)
        if (!res.ok) {
          setVerificationResult({ status: 'Invalid' })
          setLoading(false)
          return
        }

        const data = await res.json()
        const payload = data?.data || data
        if (payload && payload.status === 'Valid') {
          setVerificationResult({
            status: 'Valid',
            ...payload,
          })
        } else {
          setVerificationResult({ status: 'Invalid' })
        }
      } catch {
        setVerificationResult({ status: 'Invalid' })
      } finally {
        setLoading(false)
      }
    }

    fetchVerification()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full border-4 border-primary/20 border-t-primary w-12 h-12 mb-4"></div>
        <p className="text-gray-500">Verifying...</p>
      </div>
    )
  }

  if (verificationResult.status === 'Invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] text-center transition-colors">
        <div className="w-full max-w-md rounded-[26px] bg-[var(--card)] p-8 sm:p-10 border border-[var(--card-border)] shadow-[var(--shadow-card)]">
          <div className="w-16 h-16 rounded-full bg-[var(--danger-bg)] text-[#b53c37] flex items-center justify-center mx-auto mb-5 border border-rose-200/60">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--danger-bg)] text-[#b53c37] border border-rose-200/60 mb-3">
            Revoked / Invalid
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--text-heading)] mb-2">Verification Failed</h1>
          <p className="text-xs text-[var(--mute)] leading-relaxed mb-6">
            The verification code is invalid, expired, or has been revoked by institutional authority.
          </p>
          <p className="text-[11px] text-[var(--mute)]">
            Please verify the code or contact the administration at {brand.supportEmail}.
          </p>
        </div>
      </div>
    )
  }

  // Valid result - render based on document type
  const isCertificate = Boolean(
    verificationResult.status === 'Valid' &&
    (verificationResult.document_type === 'certificate' ||
      (verificationResult.student_name && verificationResult.course_name)),
  )
  const isInvoice = Boolean(
    verificationResult.status === 'Valid' &&
    (verificationResult.document_type === 'invoice' || Boolean(verificationResult.invoice_number)),
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] transition-colors">
      <div className="w-full max-w-md rounded-[26px] bg-[var(--card)] p-8 sm:p-10 border border-[var(--card-border)] shadow-[var(--shadow-card)] text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--success-bg)] text-[#1b7a4b] flex items-center justify-center mx-auto mb-4 border border-emerald-200/60">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--success-bg)] text-[#1b7a4b] border border-emerald-200/60 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1b7a4b]" />
            Official Valid Record
          </span>
        </div>

        {isCertificate && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">Certificate Verified</h1>
            <div className="rounded-[18px] bg-[var(--panel)] p-4 border border-[var(--border)] text-left space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">Student Name</p>
                <h2 className="text-base font-bold text-[var(--text-heading)] mt-0.5">{verificationResult.student_name}</h2>
              </div>
              <div className="border-t border-[var(--border)] pt-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">Course Program</p>
                <h2 className="text-sm font-semibold text-[var(--text-heading)] mt-0.5">{verificationResult.course_name}</h2>
              </div>
              <div className="border-t border-[var(--border)] pt-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">Issue Date</p>
                <p className="text-xs font-mono font-bold text-[var(--text)] mt-0.5">
                  {new Date(verificationResult.issue_date!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--success-bg)] text-[#1b7a4b]">
              Valid
            </div>
          </div>
        )}

        {isInvoice && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">Invoice Verified</h1>
            <div className="rounded-[18px] bg-[var(--panel)] p-4 border border-[var(--border)] text-left space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">Invoice Number</p>
                <h2 className="text-base font-mono font-bold text-[var(--text-heading)] mt-0.5">{verificationResult.invoice_number}</h2>
              </div>
              <div className="border-t border-[var(--border)] pt-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">Issue Date</p>
                <p className="text-xs font-mono font-bold text-[var(--text)] mt-0.5">
                  {new Date(verificationResult.issue_date!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--success-bg)] text-[#1b7a4b]">
              Valid
            </div>
          </div>
        )}

        {/* Fallback if we can't determine type */}
        {!isCertificate && !isInvoice && (
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-heading)] mb-2">Document Verified</h1>
            <p className="text-xs text-[var(--mute)] mb-4">The document record is verified, authentic, and active.</p>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--success-bg)] text-[#1b7a4b]">
              Valid
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--mute)]">
          Verified through {brand.displayName} Official Registry
        </div>
      </div>
    </div>
  )
}
