'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPrintSkeleton } from '@/modules/shared/components/PrintSkeleton'
import type { CertificatePrint } from '@/modules/certificates/components/CertificatePrint'

const LazyCertificatePrint = dynamic(
  () => import('@/modules/certificates/components/CertificatePrint').then((module) => module.CertificatePrint),
  { loading: () => <DashboardPrintSkeleton /> },
)

type CertificatePrintDynamicProps = Omit<ComponentProps<typeof CertificatePrint>, 'onBack'> & { onBack?: () => void }

export function CertificatePrintDynamic(props: CertificatePrintDynamicProps) {
  const router = useRouter()
  return <LazyCertificatePrint {...props} onBack={props.onBack ?? (() => router.back())} />
}
