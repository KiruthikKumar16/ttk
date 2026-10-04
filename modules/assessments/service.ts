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
      'id,course_id,title,max_score,assessment_date,created_by,created_at,form_url,sheet_url,courses(id,name),profiles(id,full_name,role)',
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
  let data: any = null
  let error: any = null
  let count: any = 0
  const initialRes = await query
    .order('assessment_date', { ascending: false })
    .range(offset, offset + options.pageSize - 1)
  data = initialRes.data
  error = initialRes.error
  count = initialRes.count

  // Graceful fallback if form_url or sheet_url columns do not exist in database yet
  if (error && (error.message?.includes('form_url') || error.code === '42703')) {
    const fallbackQuery = supabase
      .from('assessments')
      .select(
        'id,course_id,title,max_score,assessment_date,created_by,created_at,courses(id,name),profiles(id,full_name,role)',
        { count: 'exact' },
      )
    if (options.courseId) fallbackQuery.eq('course_id', options.courseId)
    if (options.search) {
      const term = options.search
        .trim()
        .slice(0, 100)
        .replace(/[\\%_,()]/g, ' ')
      fallbackQuery.ilike('title', `%${term}%`)
    }
    const fallbackResult = await fallbackQuery
      .order('assessment_date', { ascending: false })
      .range(offset, offset + options.pageSize - 1)
    data = fallbackResult.data
    error = fallbackResult.error
    count = fallbackResult.count
  }

  if (error) throw error
  return {
    totalCount: count ?? 0,
    data: (data ?? []).map((row: any) => {
      const course = normalizeJoined(row.courses)
      const profile = normalizeJoined(row.profiles)
      return {
        id: String(row.id),
        courseId: String(row.course_id),
        courseName: String(course?.name ?? ''),
        title: String(row.title),
        maxScore: Number(row.max_score),
        assessmentDate: String(row.assessment_date),
        formUrl: row.form_url ? String(row.form_url) : null,
        sheetUrl: row.sheet_url ? String(row.sheet_url) : null,
        createdAt: String(row.created_at),
        createdBy: profile
          ? { id: String(profile.id), fullName: String(profile.full_name ?? ''), role: String(profile.role) }
          : null,
      }
    }),
  }
}
