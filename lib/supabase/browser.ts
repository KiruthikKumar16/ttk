'use client'

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { clientEnv } from '@/lib/env'

export const supabaseBrowser = createSupabaseBrowserClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)
