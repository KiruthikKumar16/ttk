'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const errorReference = error.digest ?? 'unavailable'
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag('next_error_digest', errorReference)
      Sentry.captureException(error)
    })
  }, [error, errorReference])

  return (
    <section className="panel p-6" role="alert">
      <h1>Unable to load course materials</h1>
      <p>Error reference: {errorReference}</p>
      <button className="btn-primary mt-4" onClick={reset}>
        Try again
      </button>
    </section>
  )
}
