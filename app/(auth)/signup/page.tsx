'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import {
  Clock,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [isFromUrl, setIsFromUrl] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedStatus, setSubmittedStatus] = useState<'pending' | 'active' | null>(null)
  const [registeredRole, setRegisteredRole] = useState<'staff' | 'admin' | null>(null)
  const [verifiedCode, setVerifiedCode] = useState<{
    valid: boolean
    role?: 'staff' | 'admin'
    recipientEmail?: string | null
    error?: string
  } | null>(null)
  const [verifyingCode, setVerifyingCode] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const codeParam = params.get('code')
      if (codeParam) {
        setPasscode(codeParam.toUpperCase().trim())
        setShowPasscode(true)
        setIsFromUrl(true)
      }
    }
  }, [])

  // Live invite code verification
  useEffect(() => {
    const trimmed = passcode.trim()
    if (!trimmed || trimmed.length < 3) {
      setVerifiedCode(null)
      return
    }

    const timer = setTimeout(async () => {
      setVerifyingCode(true)
      try {
        const res = await fetch(`/api/auth/verify-invite?code=${encodeURIComponent(trimmed)}`)
        const data = await res.json().catch(() => null)
        if (data) {
          const errorMessage =
            typeof data.error === 'string'
              ? data.error
              : typeof data.error === 'object' && data.error !== null
                ? data.error.message || 'Invalid code.'
                : undefined

          setVerifiedCode({
            valid: Boolean(data.valid),
            role: data.role,
            recipientEmail: data.recipientEmail,
            error: errorMessage,
          })
        }
      } catch {
        // Ignore network check failure silently
      } finally {
        setVerifyingCode(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [passcode])

  // Password rule checks
  const hasMinLength = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const isDetectedAdmin = verifiedCode?.role === 'admin' || passcode.trim().toUpperCase().startsWith('ADMIN-')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!hasLetter) {
      setError('Password must contain at least one letter (a-z).')
      return
    }

    if (!hasNumber) {
      setError('Password must contain at least one number (0-9).')
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
          passcode: (showPasscode || isFromUrl) && passcode.trim() ? passcode.trim() : undefined,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : typeof result?.error === 'object' && result?.error !== null
              ? result.error.message
              : 'Unable to complete registration. Please try again.'
        throw new Error(message || 'Unable to complete registration. Please try again.')
      }

      const role = result?.data?.role
      setRegisteredRole(role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : null)
      setSubmittedStatus(role === 'staff' || role === 'admin' ? 'active' : 'pending')
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
            Thank you, <strong className="text-slate-900">{fullName}</strong>. Your registration for{' '}
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
    const isAdmin = registeredRole === 'admin'

    return (
      <main className="login-page">
        <section className="login-card text-center" aria-labelledby="approved-title">
          <div
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 shadow-xs ${
              isAdmin
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}
          >
            <CheckCircle2 size={28} />
          </div>

          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${
              isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isAdmin ? 'Administrator Verified' : 'Verified & Approved'}
          </span>

          <h1 id="approved-title" className="text-xl font-bold text-slate-900 mb-2">
            {isAdmin ? 'Administrator Access Granted' : 'Staff Access Granted'}
          </h1>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            {isAdmin
              ? 'Your administrator invite code was verified. Your administrative account is active and ready for immediate use.'
              : 'Your academy invite code was verified. Your staff account is active and ready for immediate use.'}
          </p>

          <Link
            href="/login"
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors ${
              isAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
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
          {isDetectedAdmin
            ? 'Administrator Registration'
            : (showPasscode || isFromUrl) && passcode.trim()
              ? 'Activate Academy Access'
              : 'Request Staff Access'}
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
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Simple password requirements checklist */}
            {password.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    hasMinLength ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                  8+ characters
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    hasLetter ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      hasLetter ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                  At least 1 letter
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    hasNumber ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                  At least 1 number
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <span
                className={`text-[10px] font-medium mt-1 inline-flex items-center gap-1 ${
                  passwordsMatch ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}
          </div>

          {/* Optional One-Time Invite Code / OTP */}
          <div className="pt-1">
            {!showPasscode ? (
              <button
                type="button"
                onClick={() => setShowPasscode(true)}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
              >
                <KeyRound size={12} /> Have an invite code or OTP?
              </button>
            ) : (
              <div
                className={`p-3 rounded-lg border transition-all ${
                  isDetectedAdmin ? 'bg-purple-50/70 border-purple-200' : 'bg-indigo-50/60 border-indigo-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="passcode"
                    className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                      isDetectedAdmin ? 'text-purple-900' : 'text-indigo-900'
                    }`}
                  >
                    <KeyRound size={12} className={isDetectedAdmin ? 'text-purple-600' : 'text-indigo-600'} />
                    {isDetectedAdmin ? 'Administrator Invite Code' : 'One-Time Invite Code (OTP)'}
                    {isFromUrl && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-300">
                        <Sparkles size={9} className="text-emerald-600" /> Link Applied
                      </span>
                    )}
                  </label>
                  {!isFromUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasscode(false)
                        setPasscode('')
                        setVerifiedCode(null)
                      }}
                      className="text-[10px] text-slate-500 hover:underline"
                    >
                      Hide
                    </button>
                  )}
                </div>
                <input
                  id="passcode"
                  type="text"
                  placeholder="e.g. ADMIN-8392-WP4K or STAFF-8392-WP4K"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                />

                {/* Real-time verification badge */}
                {verifyingCode && <span className="text-[10px] text-slate-500 mt-1 block">Verifying code...</span>}
                {verifiedCode && !verifyingCode && (
                  <div className="mt-1.5">
                    {verifiedCode.valid ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          verifiedCode.role === 'admin' ? 'text-purple-700' : 'text-emerald-700'
                        }`}
                      >
                        <Check size={12} />
                        Valid {verifiedCode.role === 'admin' ? 'Administrator' : 'Staff'} Code — Instant access granted
                        without admin review.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                        <AlertCircle size={12} />
                        {typeof verifiedCode.error === 'string' ? verifiedCode.error : 'Invalid code.'}
                      </span>
                    )}
                  </div>
                )}
                {!verifiedCode && !verifyingCode && (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Invite codes grant immediate authorized access without waiting for administrator review.
                  </span>
                )}
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
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
              isDetectedAdmin
                ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            }`}
          >
            {loading
              ? 'Submitting request...'
              : isDetectedAdmin
                ? 'Register as Administrator'
                : (showPasscode || isFromUrl) && passcode.trim()
                  ? 'Activate & Register'
                  : 'Request Staff Access'}
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
