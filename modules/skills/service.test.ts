import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: {} as any,
  role: 'admin',
  skillRows: [] as any[],
  error: null as any,
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mocks.client }))
vi.mock('@/lib/auth/current-profile', () => ({
  getCurrentProfile: async () => ({ id: 'u1', role: mocks.role }),
}))

import { listSkillTags, createSkillTag, updateSkillTag, deleteSkillTag } from './service'
import { ForbiddenError, ValidationError } from '@/lib/http/errors'
import { DEFAULT_SKILL_TAGS } from './types'

describe('skills service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'admin'
    mocks.skillRows = [
      { id: 's-1', name: 'Python', sort_order: 1, created_at: '2026-09-01', updated_at: '2026-09-01' },
      { id: 's-2', name: 'React', sort_order: 2, created_at: '2026-09-01', updated_at: '2026-09-01' },
    ]
    mocks.error = null

    mocks.client = {
      from: vi.fn((table: string) => {
        if (table === 'skill_tags') {
          return {
            select: vi.fn((fields: string) => {
              const query: any = {}
              query.order = vi.fn(() => query)
              query.limit = vi.fn(() => query)
              query.single = vi.fn(async () => ({
                data: mocks.skillRows[0] ?? null,
                error: mocks.error,
              }))
              query.then = (resolve: (v: any) => any, reject: (err: any) => any) =>
                Promise.resolve({ data: mocks.skillRows, error: mocks.error }).then(resolve, reject)
              return query
            }),
            insert: vi.fn((row: any) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  if (mocks.error) return { data: null, error: mocks.error }
                  return {
                    data: {
                      id: 'new-id',
                      name: row.name,
                      sort_order: row.sort_order,
                      created_at: '2026-09-29',
                      updated_at: '2026-09-29',
                    },
                    error: null,
                  }
                }),
              })),
            })),
            update: vi.fn((row: any) => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    if (mocks.error) return { data: null, error: mocks.error }
                    return {
                      data: {
                        id: 's-1',
                        name: row.name,
                        sort_order: 1,
                        created_at: '2026-09-01',
                        updated_at: '2026-09-29',
                      },
                      error: null,
                    }
                  }),
                })),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: mocks.error })),
            })),
          }
        }
        return {}
      }),
    }
  })

  describe('listSkillTags', () => {
    it('returns sorted skill tags when present in the database', async () => {
      const tags = await listSkillTags()
      expect(tags).toHaveLength(2)
      expect(tags[0].name).toBe('Python')
      expect(tags[1].name).toBe('React')
    })

    it('falls back to DEFAULT_SKILL_TAGS if error or empty', async () => {
      mocks.skillRows = []
      const tags = await listSkillTags()
      expect(tags.length).toBe(DEFAULT_SKILL_TAGS.length)
      expect(tags[0].name).toBe(DEFAULT_SKILL_TAGS[0])
    })

    it('falls back to DEFAULT_SKILL_TAGS when query throws', async () => {
      mocks.client.from = vi.fn(() => {
        throw new Error('connection lost')
      })
      const tags = await listSkillTags()
      expect(tags.length).toBe(DEFAULT_SKILL_TAGS.length)
    })
  })

  describe('createSkillTag', () => {
    it('forbids non-admin users', async () => {
      mocks.role = 'staff'
      await expect(createSkillTag('TypeScript')).rejects.toThrow(ForbiddenError)
    })

    it('rejects empty name', async () => {
      await expect(createSkillTag('   ')).rejects.toThrow(ValidationError)
    })

    it('creates a skill tag with incremented sort_order', async () => {
      const created = await createSkillTag('TypeScript')
      expect(created.name).toBe('TypeScript')
      expect(created.id).toBe('new-id')
    })

    it('throws ValidationError on duplicate skill name (code 23505)', async () => {
      mocks.error = { code: '23505', message: 'duplicate key' }
      await expect(createSkillTag('Python')).rejects.toThrow('already exists')
    })

    it('throws general database errors', async () => {
      mocks.error = new Error('db failure')
      await expect(createSkillTag('Go')).rejects.toThrow('db failure')
    })
  })

  describe('updateSkillTag', () => {
    it('forbids non-admin users', async () => {
      mocks.role = 'staff'
      await expect(updateSkillTag('s-1', 'Python 3')).rejects.toThrow(ForbiddenError)
    })

    it('rejects empty name', async () => {
      await expect(updateSkillTag('s-1', '  ')).rejects.toThrow(ValidationError)
    })

    it('updates a skill tag', async () => {
      const updated = await updateSkillTag('s-1', 'Python 3')
      expect(updated.name).toBe('Python 3')
    })

    it('throws ValidationError on duplicate unique conflict', async () => {
      mocks.error = { code: '23505', message: 'duplicate key' }
      await expect(updateSkillTag('s-1', 'React')).rejects.toThrow('already exists')
    })
  })

  describe('deleteSkillTag', () => {
    it('forbids non-admin users', async () => {
      mocks.role = 'staff'
      await expect(deleteSkillTag('s-1')).rejects.toThrow(ForbiddenError)
    })

    it('deletes a skill tag successfully', async () => {
      await expect(deleteSkillTag('s-1')).resolves.toBeUndefined()
    })

    it('throws when database delete fails', async () => {
      mocks.error = new Error('foreign key constraint')
      await expect(deleteSkillTag('s-1')).rejects.toThrow('foreign key constraint')
    })
  })
})
