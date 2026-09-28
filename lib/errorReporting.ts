import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Get a Supabase client with service role key for bypassing RLS (used for error logging)
 * If service role key is not available, fallback to anon key (may be restricted by RLS)
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl) return null
  if (!supabaseServiceRoleKey) {
    if (!publicKey) return null
    // Fallback to a public key - RLS may prevent inserts.
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, error logging may fail due to RLS restrictions')
    return createClient(supabaseUrl, publicKey)
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

/**
 * Captures an error and logs it to both console and Supabase error_logs table.
 * @param error The error object (can be any value)
 * @param context Optional additional context to store with the error
 */
export async function captureError(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  // Always log to console for immediate visibility
  if (error instanceof Error) {
    console.error('Error captured:', error.message, error.stack, context)
  } else {
    console.error('Error captured:', error, context)
  }

  // Attempt to store in Supabase error_logs table (best effort)
  try {
    const adminSupabase = getSupabaseAdminClient()
    if (!adminSupabase) return
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    const { error: dbError } = await adminSupabase
      .from('error_logs')
      .insert({
        message,
        stack,
        context: JSON.stringify(context),
      })

    if (dbError) {
      // If inserting fails, log to console but don't throw to avoid cascading failures
      console.warn('Failed to log error to Supabase:', dbError)
    }
  } catch (err) {
    // Never let error logging break the application
    console.warn('Exception while attempting to log error to Supabase:', err)
  }
}
