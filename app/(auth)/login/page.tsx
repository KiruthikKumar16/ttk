'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Clock, Eye, EyeOff, ArrowRight } from 'lucide-react'

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
              : 'Unable to sign in. Please try again.'
        throw new Error(message || 'Unable to sign in. Please try again.')
      }

      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg)] transition-colors">
      <section
        className="w-full max-w-md rounded-[26px] bg-[var(--card)] p-8 sm:p-10 border border-[var(--card-border)] shadow-[var(--shadow-card)] text-[var(--text)] transition-all"
        aria-labelledby="login-title"
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
          <h1 id="login-title" className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--text-heading)]">
            Sign in to {brand.displayName}
          </h1>
          <p className="mt-1 text-xs text-[var(--mute)]">
            Academic &amp; operations portal for authorized personnel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@thoorigai.in"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--mute-light)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 pr-11 text-sm text-[var(--text)] placeholder-[var(--mute-light)] transition-all focus:border-[var(--g1)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--g5)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)] transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isPendingApproval && (
            <div className="p-4 rounded-[18px] bg-[var(--warning-bg)] border border-amber-200/60 text-xs text-[#a8710f] space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Clock size={15} /> Account Awaiting Approval
              </div>
              <p className="text-[11px] leading-relaxed">
                Your registration has been received and is waiting for administrator authorization.
              </p>
              <div className="pt-1">
                <Link
                  href={`/pending-approval?email=${encodeURIComponent(email)}`}
                  className="font-semibold underline inline-flex items-center gap-1 text-[11px] hover:text-[#78350f]"
                >
                  Have an invite code or OTP? Activate now <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {error && (
            <p className="p-3.5 rounded-[18px] bg-[var(--danger-bg)] border border-rose-200/60 text-xs font-medium text-[#b53c37]" role="alert">
              {error}
            </p>
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
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--mute)]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-[var(--g1)] hover:underline inline-flex items-center gap-1">
            Request Staff Access <ArrowRight size={12} />
          </Link>
        </p>
      </section>
    </main>
  )
}
