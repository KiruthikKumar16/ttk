import Link from 'next/link'
import { requirePermission } from '@/lib/auth/current-profile'
import { listPaymentPage } from '@/modules/payments/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { RecordList } from '@/modules/shared/components/RecordList'
import { money } from '@/lib/formatters'
import { getCachedCourseOptions } from '@/modules/courses/service'
import { CategoryBadge } from '@/components/CategoryBadge'

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

  const courseCategoryMap = new Map(
    courseOptions.map((c) => [c.name.trim().toLowerCase(), c.categoryName]),
  )

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
        {result.data.map((payment) => {
          const courseName = payment.course || '—'
          const catName = payment.course ? courseCategoryMap.get(payment.course.trim().toLowerCase()) : null

          return (
            <tr key={payment.id}>
              <td>
                <Link
                  href={`/invoices/${encodeURIComponent(payment.invoice)}`}
                  className="font-mono font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                >
                  {payment.invoice}
                </Link>
              </td>
              <td>
                <Link
                  href={`/students/${payment.studentId}`}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {payment.student}
                </Link>
              </td>
              <td className="text-slate-800 font-medium">{courseName}</td>
              <td>
                {catName ? (
                  <CategoryBadge categoryName={catName} />
                ) : (
                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                )}
              </td>
              <td className="text-slate-600">{payment.date}</td>
              <td>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                  {payment.method}
                </span>
              </td>
              <td className="align-right font-bold text-slate-900">{money(payment.amount)}</td>
            </tr>
          )
        })}
        {result.data.length === 0 && (
          <tr>
            <td colSpan={7}>No invoices match this search.</td>
          </tr>
        )}
      </tbody>
    </RecordList>
  )
}
