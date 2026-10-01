import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listPaymentPage } from '@/modules/payments/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'
import { money } from '@/lib/formatters'
import { getCachedCourseOptions } from '@/modules/courses/service'
import { InvoiceTableRow } from '@/modules/payments/components/InvoiceTableRow'

export default async function InvoicesPage({ searchParams }: PageProps<'/invoices'>) {
  const params = await searchParams
  const query = parseListQuery(params)
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date
  const dateFilter = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : ''

  const [, result, courseOptions] = await Promise.all([
    requirePermission('payments', 'read'),
    listPaymentPage({ ...query, date: dateFilter }),
    getCachedCourseOptions(),
  ])

  const courseCategoryObject: Record<string, string> = {}
  for (const c of courseOptions) {
    if (c.categoryName) {
      courseCategoryObject[c.name.trim().toLowerCase()] = c.categoryName
    }
  }

  return (
    <RecordList
      title="Invoices"
      description="Browse GST invoices, fee collections, and payments categorized by curriculum tier."
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
          <th>Course</th>
          <th>Category</th>
          <th>Date</th>
          <th>Method</th>
          <th className="align-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((payment) => (
          <InvoiceTableRow
            key={payment.id}
            payment={payment}
            courseCategoryMap={courseCategoryObject}
          />
        ))}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={7}>No invoices match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
