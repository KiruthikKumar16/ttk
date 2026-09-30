'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Factor = { id: string; status: 'verified' | 'unverified' }

export default function MfaPage() {
  const router = useRouter()
  const [factor, setFactor] = useState<Factor | null>(null)
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('Loading MFA settings…')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/auth/mfa')
      .then(async (response) => {
        if (!response.ok) throw new Error()
        const data = (await response.json()) as { factors: Factor[] }
        const verified = data.factors.find((item) => item.status === 'verified')
        const existing = verified ?? data.factors.find((item) => item.status === 'unverified')
        setFactor(existing ?? null)
        setMessage(
          verified
            ? 'Enter your authenticator code to continue.'
            : 'Set up an authenticator app to secure the administrator account.',
        )
      })
      .catch(() => setMessage('Unable to load MFA settings. Sign in with an administrator account.'))
  }, [])

  async function request(body: unknown) {
    const response = await fetch('/api/auth/mfa', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Unable to update MFA settings.')
    return data
  }

  async function enroll() {
    setBusy(true)
    try {
      setEnrollment(await request({ action: 'enroll' }))
      setMessage('Scan the QR code, then enter the six-digit code from your authenticator app.')
    } catch {
      setMessage('Unable to begin MFA enrollment.')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    const factorId = enrollment?.factorId ?? factor?.id
    if (!factorId) return
    setBusy(true)
    try {
      await request({ action: 'verify', factorId, code })
      setMessage('MFA verified. Redirecting…')
      router.replace('/')
      router.refresh()
    } catch {
      setMessage('The code was not accepted. Check it and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-6">
      <h1 className="text-2xl font-semibold">Administrator MFA</h1>
      <p role="status">{message}</p>
      {!factor && !enrollment && (
        <button disabled={busy} onClick={enroll} className="rounded bg-blue-700 px-4 py-2 text-white">
          Set up authenticator
        </button>
      )}
      {enrollment && (
        <div className="space-y-3">
          <img src={enrollment.qrCode} alt="Authenticator enrollment QR code" />
          <p>
            Manual setup key: <code>{enrollment.secret}</code>
          </p>
        </div>
      )}
      {(factor || enrollment) && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void verify()
          }}
        >
          <label className="block">
            Six-digit code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </label>
          <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">
            Verify code
          </button>
        </form>
      )}
    </main>
  )
}
