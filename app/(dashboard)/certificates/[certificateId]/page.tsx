import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth/current-profile'
import { getCertificateDetail } from '@/modules/certificates/service'
import { CertificatePrintDynamic } from '@/modules/certificates/components/CertificatePrintDynamic'

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  await requirePermission('certificates', 'read')
  const { certificateId } = await params
  const decodedId = decodeURIComponent(certificateId)
  const result = await getCertificateDetail(decodedId)

  if (!result?.certificate || !result?.student) {
    notFound()
  }

  return (
    <CertificatePrintDynamic
      student={result.student}
      certificateRecord={result.certificate}
    />
  )
}
