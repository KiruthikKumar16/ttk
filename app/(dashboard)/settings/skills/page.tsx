import { requirePermission } from '@/lib/auth/current-profile'
import { redirect } from 'next/navigation'
import { listSkillTags } from '@/modules/skills/service'
import { SkillTagsManager } from '@/modules/skills/components/SkillTagsManager'

export default async function SkillsSettingsPage() {
  const profile = await requirePermission('courses', 'read')
  if (profile.role !== 'admin') redirect('/')

  const skills = await listSkillTags()

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--panel)] text-[var(--mute)] border border-[var(--border)]">
              SETTINGS
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Skill tags</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Configure standardized technical skills, programming frameworks, and competency tags for learner profiles
            and curriculum indexing.
          </p>
        </div>
      </div>
      <SkillTagsManager initialSkills={skills} />
    </main>
  )
}
