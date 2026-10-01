'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { Clock, CheckCircle2, KeyRound, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedStatus, setSubmittedStatus] = useState<'pending' | 'active' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          passcode: showPasscode && passcode.trim() ? passcode.trim() : undefined,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to complete registration. Please try again.')
      }

      const role = result?.data?.role
      setSubmittedStatus(role === 'staff' ? 'active' : 'pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to complete registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 1. Success State: Awaiting Administrator Approval
  if (submittedStatus === 'pending') {
    return (
      <main className="login-page">
        <section className="login-card text-center" aria-labelledby="approval-title">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Clock size={28} />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider mb-2">
            Awaiting Approval
          </span>

          <h1 id="approval-title" className="text-xl font-bold text-slate-900 mb-2">
            Request Submitted
          </h1>

          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            Thank you, <strong className="text-slate-900">{fullName}</strong>. Your staff registration for{' '}
            <strong className="text-slate-900">{email}</strong> has been submitted.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldAlert size={14} className="text-amber-600" />
              <span>Next Steps</span>
            </div>
            <p className="text-[11px] text-slate-500">
              An academy administrator has been alerted on their dashboard. Once verified and approved, your credentials
              will become active and you will be able to log in.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Return to Sign In <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    )
  }

  // 2. Success State: Instant Passcode Authorization
  if (submittedStatus === 'active') {
    return (
      <main className="login-page">
        <section className="login-card text-center" aria-labelledby="approved-title">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 size={28} />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-2">
            Verified & Approved
          </span>

          <h1 id="approved-title" className="text-xl font-bold text-slate-900 mb-2">
            Staff Access Granted
          </h1>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Your academy invite code was verified. Your staff account is active and ready for immediate use.
          </p>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Sign In Now <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    )
  }

  // 3. Signup Form
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="signup-title">
        <Image
          className="login-logo"
          src={brand.logoPath}
          alt={`${brand.shortName} logo`}
          width={76}
          height={76}
          sizes="76px"
          priority
        />
        <p className="login-brand">{brand.displayName}</p>
        <h1 id="signup-title" className="login-title">
          Request Staff Access
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@thoorigai.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Optional Staff Passcode for instant approval */}
          <div className="pt-1">
            {!showPasscode ? (
              <button
                type="button"
                onClick={() => setShowPasscode(true)}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
              >
                <KeyRound size={12} /> Have a staff invite passcode?
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="passcode"
                    className="text-[11px] font-semibold text-indigo-900 flex items-center gap-1"
                  >
                    <KeyRound size={12} className="text-indigo-600" /> Academy Staff Invite Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasscode(false)
                      setPasscode('')
                    }}
                    className="text-[10px] text-indigo-500 hover:underline"
                  >
                    Hide
                  </button>
                </div>
                <input
                  id="passcode"
                  type="text"
                  placeholder="e.g. THOORIGAI-STAFF"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-indigo-200 rounded text-xs text-slate-900 placeholder:text-indigo-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-indigo-700 mt-1 block">
                  Staff passcodes grant immediate access without waiting for admin review.
                </span>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting request...' : 'Request Staff Access'}
          </button>
        </form>

        <p className="login-help text-xs text-slate-500 mt-5 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
