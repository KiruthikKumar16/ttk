import { requirePermission } from '@/lib/auth/current-profile'
import { NewStudentForm } from '@/modules/students/components/NewStudentForm'
import { getCachedGstCalculationSettings } from '@/modules/gst/service'
import { getCachedCourseOptions } from '@/modules/courses/service'

export default async function NewStudentPage() {
  const profile = await requirePermission('students', 'create')
  const [courses, gst] = await Promise.all([getCachedCourseOptions(), getCachedGstCalculationSettings()])
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{profile.role === 'staff' ? 'ACADEMY ENROLLMENT' : 'STUDENT REGISTRATION'}</p>
          <h1>New student</h1>
          <p className="subcopy">
            {profile.role === 'staff'
              ? 'Create a new learner profile and assign them to an active batch.'
              : 'Create an enrollment record.'}
          </p>
        </div>
      </div>
      <NewStudentForm courses={courses} gstRate={gst?.enabled ? gst.rate : 0} role={profile.role} />
    </>
  )
}
