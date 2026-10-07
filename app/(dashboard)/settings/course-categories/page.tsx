import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { listCourseCategories } from '@/modules/courses/service'
import { CourseCategoriesManager } from '@/modules/courses/components/CourseCategoriesManager'

export default async function CourseCategoriesSettingsPage() {
  const profile = await requirePermission('courses', 'manage')
  if (profile.role !== 'admin') throw new Error('Not found')
  const categories = await listCourseCategories()

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--panel)] text-[var(--mute)] border border-[var(--border)]">
              SETTINGS
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Course categories</h1>
          <p className="text-xs text-[var(--mute)] mt-1">
            Configure curriculum category tiers and duration presets (e.g. Essential 6 weeks, Elite 12 weeks).
          </p>
        </div>
      </div>
      <CourseCategoriesManager initialCategories={categories} canManage={can(profile.role, 'courses', 'manage')} />
    </main>
  )
}
