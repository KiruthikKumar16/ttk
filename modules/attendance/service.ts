import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeJoined } from '@/lib/supabase/relations'
import { decodeCursor, encodeCursor } from '@/lib/pagination'
import { z } from 'zod'

export async function listAttendancePage(options: {
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
  keyset?: boolean
  cursor?: string
}) {
  const supabase = await createClient()
  const offset = (options.page - 1) * options.pageSize
  let query = supabase
    .from('attendance')
    .select(
      'id,student_id,course_id,session_date,status,students(register_id,name),courses(name),profiles(full_name)',
      options.keyset ? undefined : { count: 'exact' },
    )
  const cursorSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), id: z.string().uuid() })
  if (options.keyset && options.cursor) {
    const cursor = decodeCursor(options.cursor, cursorSchema)
    query = query.or(`session_date.lt.${cursor.date},and(session_date.eq.${cursor.date},id.lt.${cursor.id})`)
  }
  if (options.search) {
    const q = options.search
      .trim()
      .slice(0, 100)
      .replace(/[\\%_,()]/g, ' ')
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`, { referencedTable: 'students' })
  }
  const orderedQuery = options.keyset
    ? query
        .order('session_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(options.pageSize + 1)
    : query
        .order('session_date', { ascending: options.direction === 'asc' })
        .range(offset, offset + options.pageSize - 1)
  const { data: rawData, error, count } = await orderedQuery
  if (error) throw error
  const hasMore = Boolean(options.keyset && rawData && rawData.length > options.pageSize)
  const data = options.keyset ? (rawData ?? []).slice(0, options.pageSize) : rawData
  return {
    totalCount: count ?? 0,
    ...(options.keyset
      ? {
          hasMore,
          nextCursor:
            hasMore && data?.length
              ? encodeCursor({ date: String(data[data.length - 1].session_date), id: String(data[data.length - 1].id) })
              : null,
        }
      : {}),
    data: (data ?? []).map((row) => {
      const student = normalizeJoined(row.students)
      const course = normalizeJoined(row.courses)
      const profile = normalizeJoined(row.profiles)
      return {
        id: String(row.id),
        studentId: Number(student?.register_id),
        studentName: String(student?.name ?? ''),
        courseId: String(row.course_id),
        courseName: String(course?.name ?? ''),
        sessionDate: String(row.session_date),
        status: String(row.status),
        markedBy: profile?.full_name ? String(profile.full_name) : '—',
      }
    }),
  }
}
