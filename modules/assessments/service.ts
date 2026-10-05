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

  // 1. Attempt primary query with joined relationships and Google Forms fields
  try {
    let query = supabase
      .from('assessments')
      .select(
        'id,course_id,title,max_score,assessment_date,created_by,created_at,form_url,sheet_url,courses!assessments_course_id_fkey(id,name),profiles!assessments_created_by_fkey(id,full_name,role)',
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

    if (!error && data) {
      return {
        totalCount: count ?? data.length,
        data: data.map((row: any) => {
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
  } catch (err) {
    console.warn('[listAssessmentPage] Primary query failed, attempting resilient fallback:', err)
  }

  // 2. Resilient fallback query: core columns + Google Form links
  try {
    let fallbackQuery = supabase
      .from('assessments')
      .select('id,course_id,title,max_score,assessment_date,created_by,created_at,form_url,sheet_url', {
        count: 'exact',
      })
    if (options.courseId) fallbackQuery = fallbackQuery.eq('course_id', options.courseId)
    if (options.search) {
      const term = options.search
        .trim()
        .slice(0, 100)
        .replace(/[\\%_,()]/g, ' ')
      fallbackQuery = fallbackQuery.ilike('title', `%${term}%`)
    }
    const { data, error, count } = await fallbackQuery
      .order('assessment_date', { ascending: false })
      .range(offset, offset + options.pageSize - 1)

    if (error || !data) {
      return { totalCount: 0, data: [] }
    }

    const courseIds = Array.from(new Set(data.map((r: any) => r.course_id).filter(Boolean)))
    const userIds = Array.from(new Set(data.map((r: any) => r.created_by).filter(Boolean)))

    let courseMap = new Map<string, string>()
    let profileMap = new Map<string, { id: string; fullName: string; role: string }>()

    if (courseIds.length > 0) {
      const { data: cData } = await supabase.from('courses').select('id, name').in('id', courseIds)
      if (cData) courseMap = new Map(cData.map((c: any) => [c.id, c.name]))
    }
    if (userIds.length > 0) {
      const { data: pData } = await supabase.from('profiles').select('id, full_name, role').in('id', userIds)
      if (pData) {
        profileMap = new Map(
          pData.map((p: any) => [
            p.id,
            { id: String(p.id), fullName: String(p.full_name || ''), role: String(p.role || 'staff') },
          ]),
        )
      }
    }

    return {
      totalCount: count ?? data.length,
      data: data.map((row: any) => ({
        id: String(row.id),
        courseId: String(row.course_id),
        courseName: courseMap.get(String(row.course_id)) ?? '',
        title: String(row.title),
        maxScore: Number(row.max_score),
        assessmentDate: String(row.assessment_date),
        formUrl: row.form_url ? String(row.form_url) : null,
        sheetUrl: row.sheet_url ? String(row.sheet_url) : null,
        createdAt: String(row.created_at),
        createdBy: profileMap.get(String(row.created_by)) ?? null,
      })),
    }
  } catch (err) {
    console.error('[listAssessmentPage] Fallback failed:', err)
    return { totalCount: 0, data: [] }
  }
}
