import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { paiseToRupees } from '@/lib/money'
import { unstable_cache, revalidateTag } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { ForbiddenError } from '@/lib/http/errors'
import type { Course, CourseCategory } from '@/lib/types'

const readCachedCourseOptions = unstable_cache(
  async () => {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('courses')
      .select('id,name,fee,duration,description,gst_inclusive,category_id,category:course_categories(id,name,duration)')
      .order('name')
      .limit(200)
    if (error) throw error
    return (data ?? []).map((course: any) => ({
      id: String(course.id),
      name: String(course.name),
      fee: paiseToRupees(Number(course.fee)),
      duration: String(course.duration),
      description: course.description ?? undefined,
      gstInclusive: Boolean(course.gst_inclusive),
      categoryId: course.category_id ? String(course.category_id) : undefined,
      categoryName: course.category?.name ? String(course.category.name) : undefined,
    }))
  },
  ['course-options-v2'],
  { revalidate: 3600, tags: ['course-options'] },
)

export async function listCourseCategories(): Promise<CourseCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_categories')
    .select('id, name, duration, created_at, updated_at, courses(count)')
    .order('name')
  if (error) throw error
  return (data ?? []).map((cat: any) => ({
    id: String(cat.id),
    name: String(cat.name),
    duration: String(cat.duration),
    createdAt: cat.created_at ? String(cat.created_at) : undefined,
    updatedAt: cat.updated_at ? String(cat.updated_at) : undefined,
    courseCount: Array.isArray(cat.courses) && cat.courses[0] ? Number(cat.courses[0].count) : 0,
  }))
}

export async function createCourseCategory(input: { name: string; duration: string }): Promise<CourseCategory> {
  const profile = await getCurrentProfile()
  if (!can(profile.role, 'courses', 'manage')) throw new ForbiddenError('Only admins can create categories.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_categories')
    .insert({
      name: input.name.trim(),
      duration: input.duration.trim(),
    })
    .select('id, name, duration, created_at, updated_at')
    .single()
  if (error) throw error
  revalidateTag('course-options', { expire: 0 })
  return {
    id: String(data.id),
    name: String(data.name),
    duration: String(data.duration),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
    courseCount: 0,
  }
}

export async function updateCourseCategory(
  id: string,
  input: { name?: string; duration?: string },
): Promise<CourseCategory> {
  const profile = await getCurrentProfile()
  if (!can(profile.role, 'courses', 'manage')) throw new ForbiddenError('Only admins can update categories.')

  const supabase = await createClient()
  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.duration !== undefined) updates.duration = input.duration.trim()

  const { data, error } = await supabase
    .from('course_categories')
    .update(updates)
    .eq('id', id)
    .select('id, name, duration, created_at, updated_at')
    .single()
  if (error) throw error
  revalidateTag('course-options', { expire: 0 })
  return {
    id: String(data.id),
    name: String(data.name),
    duration: String(data.duration),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  }
}

export async function deleteCourseCategory(id: string): Promise<void> {
  const profile = await getCurrentProfile()
  if (!can(profile.role, 'courses', 'manage')) throw new ForbiddenError('Only admins can delete categories.')

  const supabase = await createClient()
  const { error } = await supabase.from('course_categories').delete().eq('id', id)
  if (error) throw error
  revalidateTag('course-options', { expire: 0 })
}

export async function listCoursePage(options: {
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
  categoryId?: string
}): Promise<{ data: Course[]; totalCount: number }> {
  const supabase = await createClient()
  const offset = (options.page - 1) * options.pageSize
  let query = supabase.from('courses').select('*, category:course_categories(id, name, duration)', { count: 'exact' })

  if (options.search) {
    query = query.ilike('name', `%${options.search.replace(/[\\%_,()]/g, ' ').trim()}%`)
  }

  if (options.categoryId) {
    if (options.categoryId === 'uncategorized') {
      query = query.is('category_id', null)
    } else {
      query = query.eq('category_id', options.categoryId)
    }
  }

  const allowedSort = ['name', 'fee', 'duration', 'created_at'] as const
  const sort = allowedSort.includes(options.sort as (typeof allowedSort)[number]) ? options.sort : 'name'
  const { data, error, count } = await query
    .order(sort, { ascending: options.direction === 'asc' })
    .range(offset, offset + options.pageSize - 1)
  if (error) throw error

  return {
    data: (data ?? []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      fee: paiseToRupees(Number(row.fee)),
      duration: String(row.duration),
      description: row.description ? String(row.description) : undefined,
      gstInclusive: Boolean(row.gst_inclusive),
      categoryId: row.category_id ? String(row.category_id) : undefined,
      categoryName: row.category?.name ? String(row.category.name) : undefined,
    })),
    totalCount: count ?? 0,
  }
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id,name,fee,duration,description,gst_inclusive,category_id,category:course_categories(id,name,duration)')
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
        categoryId: data.category_id ? String(data.category_id) : undefined,
        categoryName: (data.category as any)?.name ? String((data.category as any).name) : undefined,
      }
    : null
}

export async function listCourseOptions(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id,name,fee,duration,description,gst_inclusive,category_id,category:course_categories(id,name,duration)')
    .order('name')
    .limit(200)
  if (error) throw error
  return (data ?? []).map((course: any) => ({
    id: String(course.id),
    name: String(course.name),
    fee: paiseToRupees(Number(course.fee)),
    duration: String(course.duration),
    description: course.description ?? undefined,
    gstInclusive: Boolean(course.gst_inclusive),
    categoryId: course.category_id ? String(course.category_id) : undefined,
    categoryName: course.category?.name ? String(course.category.name) : undefined,
  }))
}

/**
 * Return the shared, role-independent course choices after checking the caller's course-read permission.
 * The course table's SELECT policy grants the same complete catalog to every supported role.
 */
export async function getCachedCourseOptions() {
  const profile = await getCurrentProfile()
  if (!['admin', 'staff'].includes(profile.role)) throw new ForbiddenError()
  return readCachedCourseOptions()
}
