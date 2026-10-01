import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { ForbiddenError, ValidationError } from '@/lib/http/errors'
import { DEFAULT_SKILL_TAGS, type SkillTag } from './types'

export async function listSkillTags(): Promise<SkillTag[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('skill_tags')
      .select('id, name, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return DEFAULT_SKILL_TAGS.map((name, index) => ({
        id: `default-${index + 1}`,
        name,
        sortOrder: index + 1,
      }))
    }

    return data.map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      sortOrder: Number(row.sort_order ?? 0),
      createdAt: row.created_at ? String(row.created_at) : undefined,
      updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    }))
  } catch {
    return DEFAULT_SKILL_TAGS.map((name, index) => ({
      id: `default-${index + 1}`,
      name,
      sortOrder: index + 1,
    }))
  }
}

export async function createSkillTag(name: string): Promise<SkillTag> {
  const profile = await getCurrentProfile()
  if (profile.role !== 'admin') throw new ForbiddenError('Only admins can create skill tags.')

  const trimmed = name.trim()
  if (!trimmed) throw new ValidationError('Skill name is required.')

  const supabase = await createClient()

  // Get max sort_order
  const { data: existing } = await supabase
    .from('skill_tags')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('skill_tags')
    .insert({
      name: trimmed,
      sort_order: nextOrder,
    })
    .select('id, name, sort_order, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') throw new ValidationError('A skill with this name already exists.')
    throw error
  }

  return {
    id: String(data.id),
    name: String(data.name),
    sortOrder: Number(data.sort_order),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  }
}

export async function updateSkillTag(id: string, name: string): Promise<SkillTag> {
  const profile = await getCurrentProfile()
  if (profile.role !== 'admin') throw new ForbiddenError('Only admins can edit skill tags.')

  const trimmed = name.trim()
  if (!trimmed) throw new ValidationError('Skill name is required.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skill_tags')
    .update({
      name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, name, sort_order, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') throw new ValidationError('A skill with this name already exists.')
    throw error
  }

  return {
    id: String(data.id),
    name: String(data.name),
    sortOrder: Number(data.sort_order),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  }
}

export async function deleteSkillTag(id: string): Promise<void> {
  const profile = await getCurrentProfile()
  if (profile.role !== 'admin') throw new ForbiddenError('Only admins can delete skill tags.')

  const supabase = await createClient()
  const { error } = await supabase.from('skill_tags').delete().eq('id', id)
  if (error) throw error
}
