import 'server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
  if (!result.success) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for privileged Supabase access.')
  }
  return result.data
}
