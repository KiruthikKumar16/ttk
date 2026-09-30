'use client'

import { useRouter } from 'next/navigation'
import type { GstSettings } from '@/lib/types'
import { GstSettingsPage } from '@/modules/gst/components/GstSettings'

export function GstSettingsClient({ settings, editable }: { settings: GstSettings | null; editable: boolean }) {
  const router = useRouter()
  return (
    <GstSettingsPage
      settings={settings}
      editable={editable}
      onSave={async (value) => {
        const response = await fetch('/api/gst', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Unable to save GST settings.')
        router.refresh()
      }}
    />
  )
}
