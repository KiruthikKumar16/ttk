'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPrintSkeleton } from '@/modules/shared/components/PrintSkeleton'
import type { InvoicePrint } from '@/modules/payments/components/InvoicePrint'

const LazyInvoicePrint = dynamic(
  () => import('@/modules/payments/components/InvoicePrint').then((module) => module.InvoicePrint),
  { loading: () => <DashboardPrintSkeleton /> },
)

type InvoicePrintDynamicProps = Omit<ComponentProps<typeof InvoicePrint>, 'onBack'> & { onBack?: () => void }

export function InvoicePrintDynamic(props: InvoicePrintDynamicProps) {
  const router = useRouter()
  return <LazyInvoicePrint {...props} onBack={props.onBack ?? (() => router.back())} />
}
