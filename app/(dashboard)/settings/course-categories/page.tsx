import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { listCourseCategories } from '@/modules/courses/service'
import { CourseCategoriesManager } from '@/modules/courses/components/CourseCategoriesManager'

export default async function CourseCategoriesSettingsPage() {
  const profile = await requirePermission('courses', 'manage')
  if (profile.role !== 'admin') throw new Error('Not found')
  const categories = await listCourseCategories()

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Course categories</h1>
          <p className="subcopy">
            Configure curriculum category tiers and duration presets (e.g. Essential 6 weeks, Elite 12 weeks).
          </p>
        </div>
      </div>
      <CourseCategoriesManager
        initialCategories={categories}
        canManage={can(profile.role, 'courses', 'manage')}
      />
    </main>
  )
}
