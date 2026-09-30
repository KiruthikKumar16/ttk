import { requirePermission } from '@/lib/auth/current-profile'
import { NewStudentForm } from '@/modules/students/components/NewStudentForm'
import { getCachedGstCalculationSettings } from '@/modules/gst/service'
import { getCachedCourseOptions } from '@/modules/courses/service'

export default async function NewStudentPage() {
  await requirePermission('students', 'create')
  const [courses, gst] = await Promise.all([getCachedCourseOptions(), getCachedGstCalculationSettings()])
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>New student</h1>
          <p className="subcopy">Create an enrollment record.</p>
        </div>
      </div>
      <NewStudentForm courses={courses} gstRate={gst?.enabled ? gst.rate : 0} />
    </>
  )
}
