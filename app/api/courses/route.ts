import { z } from 'zod'
import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { courseSchema } from '@/lib/validation'
import { paginationMeta, paginationQuerySchema, pagePagination } from '@/lib/pagination'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'
import { revalidateTag } from 'next/cache'

const getCoursesQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().optional(),
})

const createCourseSchema = courseSchema.extend({ id: z.string().optional() })
const deleteCourseQuerySchema = z.object({ id: z.string().min(1) })

export const GET = withApi(
  { roles: rolesFor('courses', 'read'), query: getCoursesQuerySchema },
  async ({ query, supabase }) => {
    const pagination = pagePagination(query.page, query.pageSize)
    let dbQuery = supabase!
      .from('courses')
      .select('*, category:course_categories(id, name, duration)', { count: 'exact' })

    if (query.categoryId) {
      if (query.categoryId === 'uncategorized') {
        dbQuery = dbQuery.is('category_id', null)
      } else {
        dbQuery = dbQuery.eq('category_id', query.categoryId)
      }
    }

    const { data, error, count } = await dbQuery
      .order('name')
      .range(pagination.offset, pagination.offset + pagination.limit - 1)
    if (error) throw error

    const courses = (data ?? []).map((course: any) => ({
      id: course.id,
      name: course.name,
      fee: paiseToRupees(Number(course.fee)),
      duration: course.duration,
      description: course.description,
      gstInclusive: course.gst_inclusive,
      categoryId: course.category_id ?? null,
      categoryName: course.category?.name ?? null,
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
      .upsert({
        id,
        name: body.name,
        fee: rupeesToPaise(body.fee),
        duration: body.duration,
        description: body.description,
        gst_inclusive: body.gstInclusive,
        category_id: body.categoryId ?? null,
      })
      .select('*, category:course_categories(id, name, duration)')
      .single()
    if (error) throw error
    if (!data) throw new Error('No course row was returned after save.')
    revalidateTag('course-options', { expire: 0 })

    return {
      ...data,
      fee: paiseToRupees(Number(data.fee)),
      gstInclusive: Boolean(data.gst_inclusive),
      categoryId: data.category_id ?? null,
      categoryName: (data.category as any)?.name ?? null,
    }
  },
)

export const DELETE = withApi(
  { roles: rolesFor('courses', 'delete'), query: deleteCourseQuerySchema },
  async ({ query, supabase }) => {
    const { error } = await supabase!.from('courses').delete().eq('id', query.id)
    if (error) throw error
    revalidateTag('course-options', { expire: 0 })
    return { success: true, message: 'Course deleted' }
  },
)
