import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { GstSettings } from '@/lib/types'
import { unstable_cache } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const readCachedGstCalculationSettings = unstable_cache(
  async () => {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.from('gst_settings').select('rate,enabled').eq('id', 'default').maybeSingle()
    if (error) throw error
    return data ? { rate: Number(data.rate), enabled: Boolean(data.enabled) } : null
  },
  ['gst-calculation-settings-v1'],
  { revalidate: 3600, tags: ['gst-settings'] },
)

export async function getGstSettings(): Promise<GstSettings | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('gst_settings').select('rate,gstin,enabled').limit(1).maybeSingle()
  if (error) throw error
  return data
    ? { rate: Number(data.rate), gstin: data.gstin ? String(data.gstin) : null, enabled: Boolean(data.enabled) }
    : null
}

/** Read only the non-sensitive tax calculation fields for an already-authorized workflow. */
export async function getCachedGstCalculationSettings() {
  return readCachedGstCalculationSettings()
}
