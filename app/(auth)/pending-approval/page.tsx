'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { Clock, ShieldAlert, ArrowRight, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function PendingApprovalPage() {
  const [showRedeem, setShowRedeem] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activatedRole, setActivatedRole] = useState<'admin' | 'staff' | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get('email')
      const codeParam = params.get('code')
      if (emailParam) {
        setEmail(emailParam.trim().toLowerCase())
        setShowRedeem(true)
      }
      if (codeParam) {
        setCode(codeParam.toUpperCase().trim())
        setShowRedeem(true)
      }
    }
  }, [])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          code: code.trim().toUpperCase(),
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to activate account. Please check your credentials.')
      }

      const role = result?.data?.role
      setActivatedRole(role === 'admin' ? 'admin' : 'staff')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to activate account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success state: Activated
  if (activatedRole) {
    const isAdmin = activatedRole === 'admin'

    return (
      <main className="login-page">
        <section className="login-card text-center" aria-labelledby="activated-title">
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
            {isAdmin ? 'Administrator Verified' : 'Account Activated'}
          </span>

          <h1 id="activated-title" className="text-xl font-bold text-slate-900 mb-2">
            {isAdmin ? 'Administrator Access Granted' : 'Staff Access Granted'}
          </h1>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Your invite code was verified and your account is now fully activated as{' '}
            <strong className="text-slate-900 uppercase">{activatedRole}</strong>. You can sign in immediately.
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

  return (
    <main className="login-page">
      <section className="login-card text-center" aria-labelledby="pending-title">
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

        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto my-4 shadow-xs">
          <Clock size={28} />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider mb-2">
          Approval Required
        </span>

        <h1 id="pending-title" className="text-xl font-bold text-slate-900 mb-2">
          Account Pending Authorization
        </h1>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Your account has been registered, but has not yet been approved by an academy administrator. For security and
          privacy reasons, access to classroom data and students is restricted until verified.
        </p>

        {/* Self-Activation Accordion / Form */}
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/90 text-left text-xs mb-5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
              <KeyRound size={14} className="text-indigo-600" /> Have an Invite Code or OTP?
            </span>
            <button
              type="button"
              onClick={() => setShowRedeem(!showRedeem)}
              className="text-[11px] font-semibold text-indigo-700 hover:underline"
            >
              {showRedeem ? 'Hide' : 'Activate Instantly'}
            </button>
          </div>

          {showRedeem && (
            <form onSubmit={handleRedeem} className="mt-3 space-y-2.5 pt-2 border-t border-indigo-200/60">
              <p className="text-[11px] text-indigo-800">
                Enter your registered email, password, and the invite code received from your administrator.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@thoorigai.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Invite Code / OTP</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADMIN-8392-WP4K or STAFF-8392-WP4K"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                />
              </div>

              {error && (
                <div className="flex items-start gap-1.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Activating account...' : 'Redeem Code & Activate'}
              </button>
            </form>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <ShieldAlert size={14} className="text-amber-600" />
            <span>How to get authorized:</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Administrators receive real-time alerts when new access requests are filed. If your request is urgent,
            contact your branch director or department supervisor to expedite role activation.
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
