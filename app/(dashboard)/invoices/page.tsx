import { requirePermission } from '@/lib/auth/current-profile'
import { listPaymentPage } from '@/modules/payments/service'
import { parseListQuery } from '@/modules/shared/list-query'
import { getCachedCourseOptions } from '@/modules/courses/service'
import { InvoicesManagerClient } from '@/modules/payments/components/InvoicesManagerClient'

export default async function InvoicesPage({ searchParams }: PageProps<'/invoices'>) {
  const params = await searchParams
  const query = parseListQuery(params)
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date
  const dateFilter = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : ''
  const requestedStartDate = Array.isArray(params.startDate) ? params.startDate[0] : params.startDate
  const startDateFilter = requestedStartDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedStartDate) ? requestedStartDate : ''
  const requestedEndDate = Array.isArray(params.endDate) ? params.endDate[0] : params.endDate
  const endDateFilter = requestedEndDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedEndDate) ? requestedEndDate : ''

  const [, result, courseOptions] = await Promise.all([
    requirePermission('payments', 'read'),
    listPaymentPage({
      ...query,
      date: dateFilter,
      startDate: startDateFilter,
      endDate: endDateFilter,
    }),
    getCachedCourseOptions(),
  ])

  const courseCategoryObject: Record<string, string> = {}
  for (const c of courseOptions) {
    if (c.categoryName) {
      courseCategoryObject[c.name.trim().toLowerCase()] = c.categoryName
    }
  }

  return (
    <InvoicesManagerClient
      payments={result.data}
      totalCount={result.totalCount}
      page={query.page}
      pageSize={query.pageSize}
      search={query.search}
      dateFilter={dateFilter}
      startDateFilter={startDateFilter}
      endDateFilter={endDateFilter}
      sort={query.sort || 'invoice'}
      direction={query.direction || 'desc'}
      courseCategoryMap={courseCategoryObject}
    />
  )
}
