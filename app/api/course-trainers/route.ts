import { z } from 'zod'
import { withApi } from '@/lib/http/handler'

const assignmentSchema = z.object({ courseId: z.string().min(1), trainerId: z.string().uuid() })
const removeSchema = assignmentSchema

export const POST = withApi({ roles: ['admin'], body: assignmentSchema }, async ({ supabase, body, user }) => {
  const { data: trainer, error: profileError } = await supabase!
    .from('profiles')
    .select('id,role')
    .eq('id', body.trainerId)
    .maybeSingle()
  if (profileError) throw profileError
  if (trainer?.role !== 'staff' && trainer?.role !== 'admin')
    return Response.json({ error: 'Choose an active staff account.' }, { status: 400 })
  const { error } = await supabase!
    .from('course_trainers')
    .upsert(
      { course_id: body.courseId, trainer_id: body.trainerId, assigned_by: user!.id },
      { onConflict: 'course_id,trainer_id', ignoreDuplicates: true },
    )
  if (error) throw error
  return { assigned: true }
})

export const DELETE = withApi({ roles: ['admin'], query: removeSchema }, async ({ supabase, query }) => {
  const { error, count } = await supabase!
    .from('course_trainers')
    .delete({ count: 'exact' })
    .eq('course_id', query.courseId)
    .eq('trainer_id', query.trainerId)
  if (error) throw error
  if (!count) return Response.json({ error: 'Assignment not found.' }, { status: 404 })
  return { removed: true }
})
