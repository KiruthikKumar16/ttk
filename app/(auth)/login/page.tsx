'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { AuthShell } from '@/components/auth/AuthShell'
import { Clock, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handledAuthRedirect = useRef(false)

  useEffect(() => {
    if (handledAuthRedirect.current || !window.location.hash) return

    const authParams = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = authParams.get('access_token')
    const refreshToken = authParams.get('refresh_token')
    const authError = authParams.get('error') || authParams.get('error_code')
    if (!accessToken && !refreshToken && !authError) return

    handledAuthRedirect.current = true
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)

    if (authError || !accessToken || !refreshToken) {
      setError('This sign-in link is invalid, expired, or already used. Ask an administrator to send a new link.')
      return
    }

    setLoading(true)
    void supabaseBrowser.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error: sessionError }) => {
        if (sessionError || !data.session) {
          setError('This sign-in link is invalid, expired, or already used. Ask an administrator to send a new link.')
          return
        }
        window.location.replace('/')
      })
      .catch(() => {
        setError('Unable to complete sign-in. Ask an administrator to send a new link.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPendingApproval(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        if (response.status === 403 && body?.code === 'ACCOUNT_PENDING_APPROVAL') {
          setIsPendingApproval(true)
          return
        }
        const message =
          typeof body?.error === 'string'
            ? body.error
            : typeof body?.error === 'object' && body?.error !== null
              ? body.error.message
              : 'Unable to sign in. Please verify your credentials.'
        throw new Error(message || 'Unable to sign in. Please verify your credentials.')
      }

      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto">
        {/* Form Header */}
        <div className="mb-6 text-center">
          <h1 id="login-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Sign in to {brand.displayName}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            Enter your institutional credentials to access your administrative dashboard.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" aria-labelledby="login-title">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Email address
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@thoorigai.in"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-500 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
            </div>
          </div>

          {/* Password Field */}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-500 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Pending Approval Notice */}
          {isPendingApproval && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="font-bold flex items-center gap-2 text-amber-900">
                <Clock size={16} className="text-amber-700 shrink-0" aria-hidden="true" />
                <span>Account Awaiting Administrator Approval</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-normal">
                Your account was created but requires admin clearance before signing in.
              </p>
              <div className="pt-1">
                <Link
                  href={`/pending-approval?email=${encodeURIComponent(email)}`}
                  className="font-bold text-amber-950 underline hover:text-black inline-flex items-center gap-1.5 text-xs"
                >
                  Have an invite code? Activate now
                </Link>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full rounded-xl py-3 px-6 text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #1f7d52 0%, #134e35 100%)',
              boxShadow: '0 4px 14px -2px rgba(31, 125, 82, 0.4)',
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Bottom Switcher / OTP Link */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-2 text-center">
          <p className="text-xs text-slate-700 font-normal">
            New faculty or staff member?{' '}
            <Link href="/signup" className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline">
              Request Staff Access
            </Link>
          </p>
          <p className="text-xs text-slate-700 font-normal">
            Have an invite code?{' '}
            <Link href="/signup?tab=otp" className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline">
              Activate instantly
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  )
}

