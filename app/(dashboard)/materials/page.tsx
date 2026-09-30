import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { createClient } from '@/lib/supabase/server'

export default async function MaterialsPage() {
  await requirePermission('materials', 'read')
  const supabase = await createClient()
  const { data, error } = await supabase.from('courses').select('id,name').order('name').limit(100)
  if (error) throw error
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEARNING RESOURCES</p>
          <h1>Course materials</h1>
          <p className="subcopy">Choose a course to view, download, or manage its resources.</p>
        </div>
      </div>
      {data?.length ? (
        <div className="stats-grid">
          {data.map((course) => (
            <Link key={course.id} href={`/courses/${encodeURIComponent(course.id)}/materials`} className="panel p-5">
              <h2 className="font-semibold">{course.name}</h2>
              <span className="text-sm text-muted-foreground">Open materials →</span>
            </Link>
          ))}
        </div>
      ) : (
        <section className="panel p-6">
          <h2>No courses yet</h2>
          <p>Create a course before adding learning materials.</p>
          <Link href="/courses/new" className="btn-primary mt-3 inline-flex">
            Create course
          </Link>
        </section>
      )}
    </main>
  )
}
