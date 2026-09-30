import { z } from 'zod'
import { apiResult, withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'
import { courseCategorySchema } from '@/lib/validation'
import {
  listCourseCategories,
  createCourseCategory,
  updateCourseCategory,
  deleteCourseCategory,
} from '@/modules/courses/service'

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  duration: z.string().min(1).max(50).optional(),
})

const deleteCategoryQuerySchema = z.object({
  id: z.string().uuid(),
})

export const GET = withApi({ roles: rolesFor('courses', 'read') }, async () => {
  const categories = await listCourseCategories()
  return apiResult(categories)
})

export const POST = withApi(
  {
    roles: ['admin'] as const,
    body: courseCategorySchema,
    successStatus: 201,
  },
  async ({ body }) => {
    const category = await createCourseCategory(body)
    return category
  },
)

export const PATCH = withApi(
  {
    roles: ['admin'] as const,
    body: updateCategorySchema,
  },
  async ({ body }) => {
    const { id, ...data } = body
    const category = await updateCourseCategory(id, data)
    return category
  },
)

export const DELETE = withApi(
  {
    roles: ['admin'] as const,
    query: deleteCategoryQuerySchema,
  },
  async ({ query }) => {
    await deleteCourseCategory(query.id)
    return { success: true, message: 'Category deleted' }
  },
)
