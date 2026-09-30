import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'
import { listCourseCategories } from '@/modules/courses/service'
import { MaterialsDirectory } from '@/modules/materials/components/MaterialsDirectory'

export default async function MaterialsPage() {
  await requirePermission('materials', 'read')
  const supabase = await createClient()

  const [categories, { data: courses, error }] = await Promise.all([
    listCourseCategories(),
    supabase
      .from('courses')
      .select('id, name, duration, category_id, category:course_categories(id, name, duration), course_materials(count)')
      .order('name')
      .limit(200),
  ])

  if (error) throw error

  const items = (courses ?? []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name),
    duration: String(c.duration),
    categoryId: c.category_id ? String(c.category_id) : null,
    categoryName: c.category?.name ? String(c.category.name) : null,
    materialsCount: Array.isArray(c.course_materials) && c.course_materials[0]
      ? Number(c.course_materials[0].count)
      : 0,
  }))

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEARNING RESOURCES</p>
          <h1>Course materials</h1>
          <p className="subcopy">Choose a curriculum program to view, download, or manage its learning resources.</p>
        </div>
      </div>
      {items.length ? (
        <MaterialsDirectory courses={items} categories={categories} />
      ) : (
        <section className="panel p-6">
          <h2>No courses yet</h2>
          <p>Create a course before adding learning materials.</p>
          <Link href="/courses" className="btn-primary mt-3 inline-flex">
            Go to courses
          </Link>
        </section>
      )}
    </main>
  )
}
