'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  User,
  Mail,
  Lock,
  UserCheck,
} from 'lucide-react'

export default function SignupPage() {
  const [activeTab, setActiveTab] = useState<'request' | 'otp'>('request')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      const tabParam = params.get('tab')

      if (codeParam) {
        setPasscode(codeParam.toUpperCase().trim())
        setActiveTab('otp')
        setIsFromUrl(true)
      } else if (tabParam === 'otp') {
        setActiveTab('otp')
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

    if (activeTab === 'otp' && !passcode.trim()) {
      setError('Please enter your One-Time Invite Code or switch to the Staff Request tab.')
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
          passcode: activeTab === 'otp' && passcode.trim() ? passcode.trim() : undefined,
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
      <AuthShell>
        <div className="w-full max-w-md mx-auto text-left">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5 shadow-xs">
            <Clock size={28} aria-hidden="true" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider mb-2">
            Awaiting Admin Clearance
          </span>

          <h1 id="approval-title" className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Request Submitted
          </h1>

          <p className="text-xs sm:text-sm text-slate-700 mb-6 leading-relaxed">
            Thank you, <strong className="text-slate-900 font-semibold">{fullName}</strong>. Your registration for{' '}
            <strong className="text-slate-900 font-semibold">{email}</strong> has been received by academy operations.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left text-xs text-slate-700 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <ShieldAlert size={15} className="text-amber-600 shrink-0" aria-hidden="true" />
              <span>Next Steps</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              An academy administrator will review your staff access request. Once approved, you can immediately sign in
              with your email and password.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            Return to Sign In
          </Link>
        </div>
      </AuthShell>
    )
  }

  // 2. Success State: Instant Passcode Authorization
  if (submittedStatus === 'active') {
    const isAdmin = registeredRole === 'admin'

    return (
      <AuthShell>
        <div className="w-full max-w-md mx-auto text-left">
          <div
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 shadow-xs ${
              isAdmin
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}
          >
            <CheckCircle2 size={28} aria-hidden="true" />
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${
              isAdmin ? 'bg-purple-100 text-purple-900' : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {isAdmin ? 'Administrator Verified' : 'Verified & Approved'}
          </span>

          <h1 id="approved-title" className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isAdmin ? 'Administrator Access Granted' : 'Staff Access Granted'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-700 mb-6 leading-relaxed">
            {isAdmin
              ? 'Your administrator invite code was verified. Your administrative account is active and ready for immediate operations.'
              : 'Your academy invite code was verified. Your faculty staff account is active and ready for immediate operations.'}
          </p>

          <Link
            href="/login"
            className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white text-sm font-bold shadow-md transition-all cursor-pointer ${
              isAdmin ? 'bg-purple-700 hover:bg-purple-800' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            Sign In Now
          </Link>
        </div>
      </AuthShell>
    )
  }

  // 3. Signup Form
  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto">
        {/* Form Header */}
        <div className="mb-5 text-center">
          <h1 id="signup-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {isDetectedAdmin
              ? 'Administrator Registration'
              : activeTab === 'otp'
                ? 'Invite Activation'
                : 'Request Staff Access'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {activeTab === 'otp'
              ? 'Enter your invite code for immediate clearance without waiting for approval.'
              : 'Register your details to request an authorized faculty account from an administrator.'}
          </p>
        </div>

        {/* Tab Switcher: Staff Request vs Invite */}
        <div className="p-1 rounded-xl bg-slate-100/90 border border-slate-200/90 flex gap-1 mb-5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'request'}
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'request'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UserCheck size={14} aria-hidden="true" />
            <span>Staff Request</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'otp'}
            onClick={() => setActiveTab('otp')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'otp'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200/60'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-white/60'
            }`}
          >
            <span>Invite</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="signup-title">
          {/* OTP Code Field - High visibility when tab is active */}
          {activeTab === 'otp' && (
            <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="passcode"
                  className="text-xs font-bold text-slate-900 uppercase tracking-wider"
                >
                  Invite Code
                </label>
                {isFromUrl && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Sparkles size={11} className="text-emerald-700" aria-hidden="true" /> Link Applied
                  </span>
                )}
              </div>

              <input
                id="passcode"
                name="passcode"
                type="text"
                required={activeTab === 'otp'}
                placeholder="e.g. ADMIN-8392-WP4K or STAFF-8392-WP4K"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 uppercase tracking-wider shadow-xs"
              />

              {/* Real-time verification badge */}
              {verifyingCode && (
                <span className="text-[11px] text-slate-600 mt-2 block font-medium">Verifying code with server...</span>
              )}
              {verifiedCode && !verifyingCode && (
                <div className="mt-2.5">
                  {verifiedCode.valid ? (
                    <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-xs font-bold text-emerald-950 flex items-center gap-2">
                      <Check size={15} className="text-emerald-800 shrink-0" aria-hidden="true" />
                      <span>
                        Valid {verifiedCode.role === 'admin' ? 'Administrator' : 'Staff'} Code — Instant activation granted!
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-100/90 border border-rose-300 text-xs font-bold text-rose-950 flex items-center gap-2">
                      <AlertCircle size={15} className="text-rose-800 shrink-0" aria-hidden="true" />
                      <span>{typeof verifiedCode.error === 'string' ? verifiedCode.error : 'Invalid code.'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User size={16} aria-hidden="true" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="e.g. Aadhithiyan K"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
            </div>
          </div>

          {/* Institutional Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={16} aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@thoorigai.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} aria-hidden="true" />
              </div>
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>

            {/* Password requirements checklist */}
            {password.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                    hasMinLength ? 'text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      hasMinLength ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    ✓
                  </span>
                  8+ characters
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                    hasLetter ? 'text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      hasLetter ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    ✓
                  </span>
                  At least 1 letter
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                    hasNumber ? 'text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      hasNumber ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    ✓
                  </span>
                  At least 1 number
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} aria-hidden="true" />
              </div>
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <span
                className={`text-[11px] font-bold mt-1.5 inline-flex items-center gap-1 ${
                  passwordsMatch ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}
          </div>

          {/* Quick toggle to Invite if on request tab */}
          {activeTab === 'request' && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('otp')}
                className="text-xs text-emerald-800 hover:text-emerald-950 hover:underline font-bold cursor-pointer text-center"
              >
                Have an invite code? Switch to instant activation
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900"
            >
              <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full rounded-xl py-3 px-6 text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 mt-2"
            style={{
              background: 'linear-gradient(135deg, #1f7d52 0%, #134e35 100%)',
              boxShadow: '0 4px 14px -2px rgba(31, 125, 82, 0.4)',
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                <span>{activeTab === 'otp' ? 'Activating account...' : 'Submitting request...'}</span>
              </>
            ) : isDetectedAdmin ? (
              <span>Register as Administrator</span>
            ) : activeTab === 'otp' ? (
              <span>Activate &amp; Register Account</span>
            ) : (
              <span>Request Staff Access</span>
            )}
          </button>
        </form>

        <p className="mt-6 pt-5 border-t border-slate-200/80 text-center text-xs text-slate-700 font-normal">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

