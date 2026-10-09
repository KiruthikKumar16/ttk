'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  Clock,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react'

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
        const message =
          typeof result?.error === 'string'
            ? result.error
            : typeof result?.error === 'object' && result?.error !== null
              ? result.error.message
              : 'Failed to activate account. Please check your credentials.'
        throw new Error(message || 'Failed to activate account. Please check your credentials.')
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
            {isAdmin ? 'Administrator Verified' : 'Account Activated'}
          </span>

          <h1 id="activated-title" className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isAdmin ? 'Administrator Access Granted' : 'Staff Access Granted'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-700 mb-6 leading-relaxed">
            Your invite code was successfully redeemed. Your account is now fully active as{' '}
            <strong className="text-slate-900 font-bold uppercase">{activatedRole}</strong>. You can sign in immediately.
          </p>

          <Link
            href="/login"
            className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-pointer ${
              isAdmin ? 'bg-purple-700 hover:bg-purple-800' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            Sign In Now
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto text-left">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5 shadow-xs">
          <Clock size={28} aria-hidden="true" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider mb-2">
          Approval Required
        </span>

        <h1 id="pending-title" className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Account Pending Authorization
        </h1>

        <p className="text-xs sm:text-sm text-slate-700 mb-5 leading-relaxed font-normal">
          Your account was filed successfully, but has not yet been approved by an academy administrator. For security and
          privacy reasons, access to classroom data and students is restricted until verified.
        </p>

        {/* Self-Activation Accordion / Form */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 mb-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <KeyRound size={15} className="text-emerald-700" aria-hidden="true" />
              <span>Have an Invite Code or OTP?</span>
            </span>
            <button
              type="button"
              onClick={() => setShowRedeem(!showRedeem)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              {showRedeem ? 'Hide form' : 'Activate Instantly'}
            </button>
          </div>

          {showRedeem && (
            <form onSubmit={handleRedeem} className="mt-4 space-y-3.5 pt-3 border-t border-emerald-200/80">
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                Enter your registered email, password, and the invite code received from your administrator to skip the queue.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={15} aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@thoorigai.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={15} aria-hidden="true" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Invite Code / OTP</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADMIN-8392-WP4K or STAFF-8392-WP4K"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-500 uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 shadow-xs"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Activating account...' : 'Redeem Code & Activate'}
              </button>
            </form>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left text-xs text-slate-700 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <ShieldAlert size={15} className="text-amber-600 shrink-0" aria-hidden="true" />
            <span>How to get authorized:</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Administrators receive real-time alerts when new access requests are filed. If your request is urgent,
            contact your branch director or department supervisor to expedite role activation.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99] text-white text-sm font-bold shadow-md transition-all duration-200 cursor-pointer"
        >
          Return to Sign In
        </Link>
      </div>
    </AuthShell>
  )
}
