import { notFound, redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/current-profile'
import { getCertificateDetail } from '@/modules/certificates/service'
import { getStudentDetail } from '@/modules/students/service'
import { CertificatePrintDynamic } from '@/modules/certificates/components/CertificatePrintDynamic'

export default async function CertificateDetailPage({ params }: { params: Promise<{ certificateId: string }> }) {
  await requirePermission('certificates', 'read')
  const { certificateId } = await params
  const decodedId = decodeURIComponent(certificateId)
    .trim()
    .replace(/^['"]|['"]$/g, '')
  const result = await getCertificateDetail(decodedId)

  if (result?.certificate && result?.student) {
    return <CertificatePrintDynamic student={result.student} certificateRecord={result.certificate} />
  }

  // Fallback: If decodedId corresponds to a student register id (e.g. 1049 or TAI-1049), redirect to issue/view page
  const isNumeric = /^\d+$/.test(decodedId)
  const taiMatch = /^tai-(\d+)$/i.exec(decodedId)
  const studentRegId = isNumeric ? Number(decodedId) : taiMatch ? Number(taiMatch[1]) : null

  if (studentRegId !== null && Number.isSafeInteger(studentRegId) && studentRegId > 0) {
    const studentRes = await getStudentDetail(studentRegId).catch(() => null)
    if (studentRes?.student) {
      redirect(`/students/${studentRegId}/certificate`)
    }
  }

  notFound()
}
