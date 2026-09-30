'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { brand } from '@/lib/brand'
import { supabaseBrowser } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Unable to sign in. Please try again.')
      }

      // Sign in successful, redirect to home
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
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
        <h1 id="login-title" className="login-title">
          Sign in to {brand.displayName}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="login-help">Don't have an account? Please contact an administrator.</p>
      </section>
    </main>
  )
}
