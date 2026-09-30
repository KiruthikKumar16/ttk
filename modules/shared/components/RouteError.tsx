'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const errorReference = error.digest ?? 'Unavailable'
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag('next_error_digest', errorReference)
      Sentry.captureException(error)
    })
  }, [error, errorReference])

  return (
    <section role="alert" className="panel p-6">
      <h1>We couldn&rsquo;t load this page</h1>
      <p className="mt-2">Try again. If the problem continues, share this error reference with an administrator.</p>
      <p className="mt-3 text-sm">
        Error reference: <code>{errorReference}</code>
      </p>
      <button className="btn-primary mt-4" onClick={reset}>
        Retry
      </button>
    </section>
  )
}
