import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { paiseToRupees } from '@/lib/money'
import { unstable_cache } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { ForbiddenError } from '@/lib/http/errors'

const readCachedCourseOptions = unstable_cache(
  async () => {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('courses')
      .select('id,name,fee,duration,description,gst_inclusive')
      .order('name')
      .limit(100)
    if (error) throw error
    return (data ?? []).map((course) => ({
      id: String(course.id),
      name: String(course.name),
      fee: paiseToRupees(Number(course.fee)),
      duration: String(course.duration),
      description: course.description ?? undefined,
      gstInclusive: Boolean(course.gst_inclusive),
    }))
  },
  ['course-options-v1'],
  { revalidate: 3600, tags: ['course-options'] },
)

export async function listCoursePage(options: {
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
}) {
  const supabase = await createClient()
  const offset = (options.page - 1) * options.pageSize
  let query = supabase.from('courses').select('*', { count: 'exact' })
  if (options.search) query = query.ilike('name', `%${options.search.replace(/[\\%_,()]/g, ' ').trim()}%`)
  const allowedSort = ['name', 'fee', 'duration', 'created_at'] as const
  const sort = allowedSort.includes(options.sort as (typeof allowedSort)[number]) ? options.sort : 'name'
  const { data, error, count } = await query
    .order(sort, { ascending: options.direction === 'asc' })
    .range(offset, offset + options.pageSize - 1)
  if (error) throw error
  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      fee: paiseToRupees(Number(row.fee)),
      duration: String(row.duration),
      description: row.description ? String(row.description) : undefined,
      gstInclusive: Boolean(row.gst_inclusive),
    })),
    totalCount: count ?? 0,
  }
}

export async function getCourse(courseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id,name,fee,duration,description,gst_inclusive')
    .eq('id', courseId)
    .maybeSingle()
  if (error) throw error
  return data
    ? {
        id: String(data.id),
        name: String(data.name),
        fee: paiseToRupees(Number(data.fee)),
        duration: String(data.duration),
        description: data.description ?? undefined,
        gstInclusive: Boolean(data.gst_inclusive),
      }
    : null
}

export async function listCourseOptions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id,name,fee,duration,description,gst_inclusive')
    .order('name')
    .limit(100)
  if (error) throw error
  return (data ?? []).map((course) => ({
    id: String(course.id),
    name: String(course.name),
    fee: paiseToRupees(Number(course.fee)),
    duration: String(course.duration),
    description: course.description ?? undefined,
    gstInclusive: Boolean(course.gst_inclusive),
  }))
}

/**
 * Return the shared, role-independent course choices after checking the caller's course-read permission.
 * The course table's SELECT policy grants the same complete catalog to every supported role.
 */
export async function getCachedCourseOptions() {
  const profile = await getCurrentProfile()
  if (!can(profile.role, 'courses', 'read')) throw new ForbiddenError()
  return readCachedCourseOptions()
}
