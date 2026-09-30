import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth/current-profile'
import { getStudentDetail } from '@/modules/students/service'
import { CertificatePrintDynamic } from '@/modules/certificates/components/CertificatePrintDynamic'

export default async function NewCertificatePage({ params }: PageProps<'/students/[registerId]/certificate'>) {
  await requirePermission('certificates', 'issue')
  const { registerId: rawId } = await params
  const registerId = Number(rawId)
  if (!Number.isSafeInteger(registerId) || registerId <= 0) notFound()
  const result = await getStudentDetail(registerId)
  if (!result) notFound()
  return <CertificatePrintDynamic student={result.student} />
}
