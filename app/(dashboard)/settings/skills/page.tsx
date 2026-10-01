import { requirePermission } from '@/lib/auth/current-profile'
import { redirect } from 'next/navigation'
import { listSkillTags } from '@/modules/skills/service'
import { SkillTagsManager } from '@/modules/skills/components/SkillTagsManager'

export default async function SkillsSettingsPage() {
  const profile = await requirePermission('courses', 'read')
  if (profile.role !== 'admin') redirect('/')

  const skills = await listSkillTags()

  return (
    <div className="max-w-4xl">
      <SkillTagsManager initialSkills={skills} />
    </div>
  )
}
