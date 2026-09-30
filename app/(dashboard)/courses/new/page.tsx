import { requirePermission } from '@/lib/auth/current-profile'
import { NewCourseForm } from '@/modules/courses/components/NewCourseForm'

export default async function NewCoursePage() {
  await requirePermission('courses', 'create')
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>New course</h1>
        </div>
      </div>
      <NewCourseForm />
    </>
  )
}
