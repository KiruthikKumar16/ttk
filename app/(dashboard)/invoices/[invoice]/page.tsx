import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth/current-profile'
import { getPaymentByInvoice } from '@/modules/payments/service'
import { getGstSettings } from '@/modules/gst/service'
import { InvoicePrintDynamic } from '@/modules/payments/components/InvoicePrintDynamic'
import { getCachedCourseOptions } from '@/modules/courses/service'

export default async function InvoicePage({ params }: PageProps<'/invoices/[invoice]'>) {
  await requirePermission('payments', 'read')
  const { invoice } = await params
  const decodedInvoice = decodeURIComponent(invoice)
  const [result, gst, courses] = await Promise.all([
    getPaymentByInvoice(decodedInvoice),
    getGstSettings(),
    getCachedCourseOptions(),
  ])
  if (!result?.student) notFound()
  return (
    <InvoicePrintDynamic
      payment={result.payment}
      student={result.student}
      gstRate={gst?.enabled ? gst.rate : 0}
      gstin={gst?.gstin ?? null}
      courses={courses}
    />
  )
}
