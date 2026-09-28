import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/errorReporting'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
  // Log warning about missing service role key in production
  const warning = '[supabase/server] SUPABASE_SERVICE_ROLE_KEY is not set in production — server-side writes may be blocked by RLS.'
  console.warn(warning)
  // Attempt to log to Supabase for persistence, but don't let it fail
  try {
    captureError(new Error(warning), {
      context: {
        file: 'lib/supabase/server.ts',
        reason: 'missing_service_role_key_in_production'
      }
    })
  } catch (err) {
    // Ignore errors in error logging to prevent infinite loops
    console.warn('Failed to log missing service role key warning:', err)
  }
}

export const hasSupabaseConfig = Boolean(supabaseUrl && effectiveKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, effectiveKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

/**
 * Get the current user's profile from the session.
 * @param session The session object from supabase.auth.getSession()
 * @returns The profile or null if not found
 */
export async function getCurrentProfile(session: any) {
  if (!session?.user) return null
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      // Log the error to Supabase for persistence
      await captureError(error, {
        context: {
          function: 'getCurrentProfile',
          userId: session.user.id
        }
      })
      return null
    }
    return profile
  } catch (err) {
    // Also log any unexpected errors
    await captureError(err, {
      context: {
        function: 'getCurrentProfile',
        userId: session?.user?.id
      }
    })
    return null
  }
}

/**
 * Get a Supabase admin client using the service role key
 * This bypasses RLS and is intended for server-side operations only
 * @returns Supabase client with service role privileges
 */
export function getSupabaseAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
