import { z } from 'zod'
import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { courseSchema } from '@/lib/validation'
import { paginationMeta, paginationQuerySchema, pagePagination } from '@/lib/pagination'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'
import { revalidateTag } from 'next/cache'

const createCourseSchema = courseSchema.extend({ id: z.string().optional() })
const deleteCourseQuerySchema = z.object({ id: z.string().min(1) })

export const GET = withApi(
  { roles: rolesFor('courses', 'read'), query: paginationQuerySchema },
  async ({ query, supabase }) => {
    const pagination = pagePagination(query.page, query.pageSize)
    const { data, error, count } = await supabase!
      .from('courses')
      .select('*', { count: 'exact' })
      .order('name')
      .range(pagination.offset, pagination.offset + pagination.limit - 1)
    if (error) throw error

    const courses = (data ?? []).map((course) => ({
      id: course.id,
      name: course.name,
      fee: paiseToRupees(Number(course.fee)),
      duration: course.duration,
      description: course.description,
      gstInclusive: course.gst_inclusive,
    }))
    return apiResult(courses, { meta: paginationMeta(count ?? 0, pagination) })
  },
)

export const POST = withApi(
  {
    roles: rolesFor('courses', 'create'),
    body: createCourseSchema,
    successStatus: 201,
  },
  async ({ body, supabase }) => {
    const id = body.id ?? `CRS-${String(Date.now()).slice(-4)}`
    const { data, error } = await supabase!
      .from('courses')
      .insert({
        id,
        name: body.name,
        fee: rupeesToPaise(body.fee),
        duration: body.duration,
        description: body.description,
        gst_inclusive: body.gstInclusive,
      })
      .select()
      .single()
    if (error) throw error
    if (!data) throw new Error('No course row was returned after insert.')
    revalidateTag('course-options', { expire: 0 })

    return { ...data, fee: paiseToRupees(Number(data.fee)), gstInclusive: Boolean(data.gst_inclusive) }
  },
)

export const DELETE = withApi(
  { roles: rolesFor('courses', 'delete'), query: deleteCourseQuerySchema, requireAal2: true },
  async ({ query, supabase }) => {
    const { error } = await supabase!.from('courses').delete().eq('id', query.id)
    if (error) throw error
    revalidateTag('course-options', { expire: 0 })
    return { success: true, message: 'Course deleted' }
  },
)
