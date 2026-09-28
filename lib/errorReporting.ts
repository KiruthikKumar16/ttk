import 'server-only'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

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
