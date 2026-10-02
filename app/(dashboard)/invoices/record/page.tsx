import { requirePermission } from '@/lib/auth/current-profile'
import { getCachedCourseOptions } from '@/modules/courses/service'
import { getCachedGstCalculationSettings } from '@/modules/gst/service'
import { getStudentDetail, listStudentsForPayment } from '@/modules/students/service'
import { RecordPaymentForm, type StudentPaymentCandidate } from '@/modules/payments/components/RecordPaymentForm'

export default async function RecordPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePermission('payments', 'create')
  const params = await searchParams

  const rawStudentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId
  const studentId = rawStudentId && /^\d+$/.test(rawStudentId) ? Number(rawStudentId) : null

  const [students, courseOptions, gstSettings, studentDetail] = await Promise.all([
    listStudentsForPayment(),
    getCachedCourseOptions(),
    getCachedGstCalculationSettings(),
    studentId ? getStudentDetail(studentId).catch(() => null) : Promise.resolve(null),
  ])

  let initialStudent: StudentPaymentCandidate | null = null
  if (studentDetail?.student) {
    const s = studentDetail.student
    initialStudent = {
      id: String(s.registerId),
      registerId: s.registerId,
      name: s.name,
      course: s.course,
      batch: s.batch,
      total: s.total,
      paid: s.paid,
      phone: s.phone,
      email: s.email,
    }
  } else if (studentId) {
    initialStudent = students.find((s) => s.registerId === studentId) ?? null
  }

  return (
    <RecordPaymentForm
      initialStudent={initialStudent}
      students={students}
      courses={courseOptions}
      gstRate={gstSettings?.enabled ? gstSettings.rate : 0}
    />
  )
}
