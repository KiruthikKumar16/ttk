import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth/current-profile'
import { getStudentDetail } from '@/modules/students/service'
import { getCachedGstCalculationSettings } from '@/modules/gst/service'
import { StudentDetailClient } from '@/modules/students/components/StudentDetailClient'
import { can } from '@/lib/auth/permissions'
import { getCachedCourseOptions } from '@/modules/courses/service'

export default async function StudentPage({ params }: PageProps<'/students/[registerId]'>) {
  const profile = await requirePermission('students', 'read')
  const { registerId: rawId } = await params
  const registerId = Number(rawId)
  if (!Number.isSafeInteger(registerId) || registerId <= 0) notFound()
  const [result, gst, courses] = await Promise.all([
    getStudentDetail(registerId),
    getCachedGstCalculationSettings(),
    getCachedCourseOptions(),
  ])
  if (!result) notFound()
  return (
    <StudentDetailClient
      student={result.student}
      payments={result.payments}
      courses={courses}
      gstRate={gst?.enabled ? gst.rate : 0}
      canRecordPayment={can(profile.role, 'payments', 'create')}
    />
  )
}
