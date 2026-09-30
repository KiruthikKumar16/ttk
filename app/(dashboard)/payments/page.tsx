import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listPaymentPage } from '@/modules/payments/service'
import { parseCursorListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'

export default async function PaymentsPage({ searchParams }: PageProps<'/payments'>) {
  await requirePermission('payments', 'read')
  const query = parseCursorListQuery(await searchParams)
  const result = await listPaymentPage({
    ...query,
    sort: 'payment_date',
    direction: 'desc',
    keyset: true,
    cursor: query.cursor,
  })
  return (
    <RecordList
      title="Payments"
      description="Review recorded tuition payments and receipts."
      basePath="/payments"
      page={query.page}
      pageSize={query.pageSize}
      keyset
      cursor={query.cursor}
      previousCursor={query.previousCursor}
      nextCursor={result.nextCursor}
      search={query.search}
    >
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Student</th>
          <th>Payment date</th>
          <th>Method</th>
          <th className="align-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((payment) => (
          <tr key={payment.id}>
            <td>
              <Link href={`/invoices/${encodeURIComponent(payment.invoice)}`}>{payment.invoice}</Link>
            </td>
            <td>
              <Link href={`/students/${payment.studentId}`}>{payment.student}</Link>
            </td>
            <td>{payment.date}</td>
            <td>{payment.method}</td>
            <td className="align-right">{payment.amount.toLocaleString('en-IN')}</td>
          </tr>
        ))}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={5}>No payments match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
