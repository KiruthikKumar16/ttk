import { requirePermission } from '@/lib/auth/current-profile'
import { redirect } from 'next/navigation'
import { listSkillTags } from '@/modules/skills/service'
import { SkillTagsManager } from '@/modules/skills/components/SkillTagsManager'

export default async function SkillsSettingsPage() {
  const profile = await requirePermission('courses', 'read')
  if (profile.role !== 'admin') redirect('/')

  const skills = await listSkillTags()

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Skill tags</h1>
          <p className="subcopy">
            Configure standardized technical skills, programming frameworks, and competency tags for learner profiles
            and curriculum indexing.
          </p>
        </div>
      </div>
      <SkillTagsManager initialSkills={skills} />
    </main>
  )
}
