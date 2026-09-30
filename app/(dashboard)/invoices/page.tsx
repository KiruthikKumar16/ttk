import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listPaymentPage } from '@/modules/payments/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'
import { money } from '@/lib/formatters'

export default async function InvoicesPage({ searchParams }: PageProps<'/invoices'>) {
  await requirePermission('payments', 'read')
  const params = await searchParams
  const query = parseListQuery(params)
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date
  const dateFilter = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : ''
  const result = await listPaymentPage({ ...query, date: dateFilter })
  return (
    <RecordList
      title="Invoices"
      description="Browse GST invoices and their payment records."
      basePath="/invoices"
      page={query.page}
      pageSize={query.pageSize}
      totalCount={result.totalCount}
      search={query.search}
      dateFilter={dateFilter}
      sort={query.sort}
      direction={query.direction}
      sortOptions={[
        { label: 'Invoice', value: 'invoice' },
        { label: 'Payment date', value: 'payment_date' },
        { label: 'Amount', value: 'amount' },
      ]}
    >
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Student</th>
          <th>Date</th>
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
            <td className="align-right">{money(payment.amount)}</td>
          </tr>
        ))}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={5}>No invoices match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
