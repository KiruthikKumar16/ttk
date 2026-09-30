import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeJoined } from '@/lib/supabase/relations'

export async function listAssessmentPage(options: {
  page: number
  pageSize: number
  search: string
  courseId: string
}) {
  const supabase = await createClient()
  const offset = (options.page - 1) * options.pageSize
  let query = supabase
    .from('assessments')
    .select(
      'id,course_id,title,max_score,assessment_date,created_by,created_at,courses(id,name),profiles(id,full_name,role)',
      { count: 'exact' },
    )
  if (options.courseId) query = query.eq('course_id', options.courseId)
  if (options.search) {
    const term = options.search
      .trim()
      .slice(0, 100)
      .replace(/[\\%_,()]/g, ' ')
    query = query.ilike('title', `%${term}%`)
  }
  const { data, error, count } = await query
    .order('assessment_date', { ascending: false })
    .range(offset, offset + options.pageSize - 1)
  if (error) throw error
  return {
    totalCount: count ?? 0,
    data: (data ?? []).map((row) => {
      const course = normalizeJoined(row.courses)
      const profile = normalizeJoined(row.profiles)
      return {
        id: String(row.id),
        courseId: String(row.course_id),
        courseName: String(course?.name ?? ''),
        title: String(row.title),
        maxScore: Number(row.max_score),
        assessmentDate: String(row.assessment_date),
        createdAt: String(row.created_at),
        createdBy: profile
          ? { id: String(profile.id), fullName: String(profile.full_name ?? ''), role: String(profile.role) }
          : null,
      }
    }),
  }
}
