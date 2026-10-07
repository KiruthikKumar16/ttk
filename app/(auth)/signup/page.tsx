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
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg)] transition-colors">
      <section
        className="w-full max-w-md rounded-[26px] bg-[var(--card)] p-8 sm:p-10 border border-[var(--card-border)] shadow-[var(--shadow-card)] text-[var(--text)] transition-all"
        aria-labelledby="signup-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-[20px] bg-[var(--panel)] border border-[var(--border)] p-2 shadow-xs flex items-center justify-center">
            <Image
              src={brand.logoPath}
              alt={`${brand.shortName} logo`}
              width={56}
              height={56}
              priority
              className="object-contain"
            />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--g1)]">
            {brand.displayName}
          </p>
          <h1 id="signup-title" className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--text-heading)]">
            {isDetectedAdmin
              ? 'Administrator Registration'
              : (showPasscode || isFromUrl) && passcode.trim()
                ? 'Activate Academy Access'
                : 'Request Staff Access'}
          </h1>
          <p className="mt-1 text-xs text-[var(--mute)]">
            Institutional account onboarding and invite verification
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. Aadhithiyan K"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--mute-light)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
              Institutional Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@thoorigai.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--mute-light)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 pr-11 text-sm text-[var(--text)] placeholder-[var(--mute-light)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)] transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Password requirements checklist */}
            {password.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    hasMinLength ? 'text-[#1b7a4b]' : 'text-[var(--mute)]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      hasMinLength ? 'bg-[var(--success-bg)] text-[#1b7a4b]' : 'bg-[var(--border)] text-[var(--mute)]'
                    }`}
                  >
                    ✓
                  </span>
                  8+ characters
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    hasLetter ? 'text-[#1b7a4b]' : 'text-[var(--mute)]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      hasLetter ? 'bg-[var(--success-bg)] text-[#1b7a4b]' : 'bg-[var(--border)] text-[var(--mute)]'
                    }`}
                  >
                    ✓
                  </span>
                  At least 1 letter
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    hasNumber ? 'text-[#1b7a4b]' : 'text-[var(--mute)]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      hasNumber ? 'bg-[var(--success-bg)] text-[#1b7a4b]' : 'bg-[var(--border)] text-[var(--mute)]'
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
            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 pr-11 text-sm text-[var(--text)] placeholder-[var(--mute-light)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)] transition-colors p-1"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <span
                className={`text-[11px] font-medium mt-1.5 inline-flex items-center gap-1 ${
                  passwordsMatch ? 'text-[#1b7a4b]' : 'text-[#b53c37]'
                }`}
              >
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}
          </div>

          {/* Optional One-Time Invite Code / OTP Chip */}
          <div className="pt-1">
            {!showPasscode ? (
              <button
                type="button"
                onClick={() => setShowPasscode(true)}
                className="text-xs text-[var(--g1)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <KeyRound size={13} /> Have an invite code or OTP?
              </button>
            ) : (
              <div
                className="p-4 rounded-[20px] border border-[var(--border)] bg-[var(--panel)] transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="passcode"
                    className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text-heading)]"
                  >
                    <KeyRound size={13} className="text-[var(--g1)]" />
                    {isDetectedAdmin ? 'Administrator Invite Code' : 'One-Time Invite Code (OTP)'}
                    {isFromUrl && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-[var(--success-bg)] text-[#1b7a4b] px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles size={10} className="text-[#1b7a4b]" /> Link Applied
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
                      className="text-xs text-[var(--mute)] hover:underline cursor-pointer"
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
                  className="w-full rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-mono font-bold text-[var(--text-heading)] placeholder-[var(--mute-light)] focus:border-[var(--g1)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)] uppercase"
                />

                {/* Real-time verification badge */}
                {verifyingCode && <span className="text-[11px] text-[var(--mute)] mt-1.5 block">Verifying code...</span>}
                {verifiedCode && !verifyingCode && (
                  <div className="mt-2">
                    {verifiedCode.valid ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b7a4b]"
                      >
                        <Check size={13} />
                        Valid {verifiedCode.role === 'admin' ? 'Administrator' : 'Staff'} Code — Instant access granted without admin review.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#b53c37]">
                        <AlertCircle size={13} />
                        {typeof verifiedCode.error === 'string' ? verifiedCode.error : 'Invalid code.'}
                      </span>
                    )}
                  </div>
                )}
                {!verifiedCode && !verifyingCode && (
                  <span className="text-[11px] text-[var(--mute)] mt-1.5 block">
                    Invite codes grant immediate authorized access without waiting for review.
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3.5 rounded-[18px] bg-[var(--danger-bg)] border border-rose-200/60 text-xs font-medium text-[#b53c37]"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full rounded-full py-3 px-6 text-sm font-semibold text-white transition-all shadow-sm hover:brightness-105 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--g1) 0%, var(--g1b) 100%)',
              boxShadow: '0 4px 14px -2px var(--g1b)',
            }}
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

        <p className="mt-8 text-center text-xs text-[var(--mute)]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[var(--g1)] hover:underline inline-flex items-center gap-1">
            Sign in <ArrowRight size={12} />
          </Link>
        </p>
      </section>
    </main>
  )
}
