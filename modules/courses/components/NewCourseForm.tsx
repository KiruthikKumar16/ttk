'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewCourseForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <form
      className="panel grid gap-4 p-6"
      onSubmit={async (event) => {
        event.preventDefault()
        setSaving(true)
        setError('')
        const values = Object.fromEntries(new FormData(event.currentTarget).entries())
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, fee: Number(values.fee), gstInclusive: false }),
        })
        const result = await response.json()
        setSaving(false)
        if (!response.ok) {
          setError(result.error?.message ?? result.error ?? 'Unable to save course.')
          return
        }
        router.push('/courses')
        router.refresh()
      }}
    >
      <label>
        Course name
        <input name="name" required maxLength={160} />
      </label>
      <label>
        Fee in INR
        <input name="fee" type="number" min="0" step="0.01" required />
      </label>
      <label>
        Duration
        <input name="duration" required maxLength={80} />
      </label>
      <label>
        Description
        <textarea name="description" maxLength={1000} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save course'}
      </button>
    </form>
  )
}
