import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Prefer the server-only SERVICE ROLE key inside route handlers and server code
 * (it bypasses RLS and is intended for admin-only usage).
 *
 * As a development convenience, fall back to the ANON key if the service role
 * is absent, but DO NOT rely on this in production — the policies currently
 * grant `authenticated` full CRUD on tables, so without a real user session
 * anon calls may be blocked by RLS.
 */
const effectiveKey = serviceRoleKey || anonKey

if (supabaseUrl && !serviceRoleKey && process.env.NODE_ENV === 'production') {
  console.warn(
    '[supabase/server] SUPABASE_SERVICE_ROLE_KEY is not set in production — ' +
    'server-side writes may be blocked by RLS.'
  )
}

export const hasSupabaseConfig = Boolean(supabaseUrl && effectiveKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, effectiveKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

