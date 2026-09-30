import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { TrainerAssignments } from '@/modules/courses/components/TrainerAssignments'

export default async function TrainerSettingsPage() {
  const profile = await requirePermission('courses', 'manage')
  if (profile.role !== 'admin') throw new Error('Not found')
  const supabase = await createClient()
  const [
    { data: courses, error: courseError },
    { data: trainers, error: trainerError },
    { data: assignments, error: assignmentError },
  ] = await Promise.all([
    supabase.from('courses').select('id,name').order('name').limit(200),
    supabase.from('profiles').select('id,full_name').in('role', ['staff', 'admin']).order('full_name').limit(200),
    supabase.from('course_trainers').select('course_id,trainer_id').order('course_id').limit(1000),
  ])
  if (courseError) throw courseError
  if (trainerError) throw trainerError
  if (assignmentError) throw assignmentError

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Instructor assignments</h1>
          <p className="subcopy">
            Staff members assigned to a course can manage attendance, assessments, and course materials for that course.
          </p>
        </div>
      </div>
      <TrainerAssignments
        courses={(courses ?? []).map((row) => ({ id: String(row.id), name: String(row.name) }))}
        trainers={(trainers ?? []).map((row) => ({ id: String(row.id), name: String(row.full_name) }))}
        initialAssignments={(assignments ?? []).map((row) => ({
          courseId: String(row.course_id),
          trainerId: String(row.trainer_id),
        }))}
      />
    </main>
  )
}
