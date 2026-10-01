import { z } from 'zod'
import { apiResult, withApi } from '@/lib/http/handler'
import {
  listSkillTags,
  createSkillTag,
  updateSkillTag,
  deleteSkillTag,
} from '@/modules/skills/service'

const createSkillSchema = z.object({
  name: z.string().min(1).max(50),
})

const updateSkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
})

const deleteSkillQuerySchema = z.object({
  id: z.string().min(1),
})

export const GET = withApi({ roles: ['admin', 'staff'] as const }, async () => {
  const skills = await listSkillTags()
  return apiResult(skills)
})

export const POST = withApi(
  {
    roles: ['admin'] as const,
    body: createSkillSchema,
    successStatus: 201,
  },
  async ({ body }) => {
    const skill = await createSkillTag(body.name)
    return apiResult(skill, { status: 201 })
  },
)

export const PATCH = withApi(
  {
    roles: ['admin'] as const,
    body: updateSkillSchema,
  },
  async ({ body }) => {
    const skill = await updateSkillTag(body.id, body.name)
    return apiResult(skill)
  },
)

export const DELETE = withApi(
  {
    roles: ['admin'] as const,
    query: deleteSkillQuerySchema,
  },
  async ({ query }) => {
    await deleteSkillTag(query.id)
    return apiResult({ success: true, message: 'Skill deleted' })
  },
)
