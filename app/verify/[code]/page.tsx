'use client'

import { notFound } from 'next/navigation'
import { use, useEffect, useState } from 'react'

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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Verification Failed</h1>
        <p className="mb-6 text-gray-600">The verification code is invalid, expired, or has been revoked.</p>
        <p className="text-sm text-gray-500">Please check the code and try again, or contact the issuing authority.</p>
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {isCertificate && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Certificate Verified</h1>
            <div className="space-y-2">
              <p className="text-gray-500">Student Name</p>
              <h2 className="text-xl font-semibold text-gray-900">{verificationResult.student_name}</h2>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500">Course Name</p>
              <h2 className="text-xl font-semibold text-gray-900">{verificationResult.course_name}</h2>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500">Issue Date</p>
              <p className="text-lg font-mono text-gray-700">
                {new Date(verificationResult.issue_date!).toLocaleDateString()}
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Valid
            </div>
          </div>
        )}

        {isInvoice && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Invoice Verified</h1>
            <div className="space-y-2">
              <p className="text-gray-500">Invoice Number</p>
              <h2 className="text-xl font-semibold text-gray-900">{verificationResult.invoice_number}</h2>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500">Issue Date</p>
              <p className="text-lg font-mono text-gray-700">
                {new Date(verificationResult.issue_date!).toLocaleDateString()}
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Valid
            </div>
          </div>
        )}

        {/* Fallback if we can't determine type */}
        {!isCertificate && !isInvoice && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Document Verified</h1>
            <p className="text-gray-500">The document is valid and active.</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Valid
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
