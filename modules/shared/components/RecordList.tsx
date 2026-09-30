import Link from 'next/link'
import type { ReactNode } from 'react'

export function RecordList({
  title,
  description,
  basePath,
  page,
  pageSize,
  totalCount,
  search,
  dateFilter = '',
  sort = '',
  direction = 'desc',
  sortOptions = [],
  keyset = false,
  cursor,
  previousCursor,
  nextCursor,
  children,
}: {
  title: string
  description: string
  basePath: string
  page: number
  pageSize: number
  totalCount?: number
  search: string
  dateFilter?: string
  sort?: string
  direction?: 'asc' | 'desc'
  sortOptions?: { label: string; value: string }[]
  keyset?: boolean
  cursor?: string
  previousCursor?: string
  nextCursor?: string | null
  children: ReactNode
}) {
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / pageSize))
  const pageHref = (value: number, next?: string, prior?: string) => {
    const params = new URLSearchParams({
      ...(search ? { search } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
      page: String(value),
      pageSize: String(pageSize),
    })
    if (keyset) {
      if (next) params.set('cursor', next)
      if (prior) params.set('previousCursor', prior)
    } else {
      if (sort) params.set('sort', sort)
      params.set('direction', direction)
    }
    return `${basePath}?${params}`
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THOORIGAI INFOTECH</p>
          <h1>{title}</h1>
          <p className="subcopy">{description}</p>
        </div>
      </div>
      <section className="panel">
        <form action={basePath} className="panel-header flex flex-wrap items-center gap-3">
          <label htmlFor="record-search" className="sr-only">
            Search records
          </label>
          <input
            id="record-search"
            name="search"
            defaultValue={search}
            placeholder="Search name, phone, or register ID"
          />
          {basePath === '/invoices' && (
            <label className="text-sm">
              Payment date
              <input
                aria-label="Filter invoices by payment date"
                name="date"
                type="date"
                defaultValue={dateFilter}
                className="ml-2"
              />
            </label>
          )}
          <input type="hidden" name="pageSize" value={pageSize} />
          {sortOptions.length > 0 && (
            <>
              <label className="sr-only" htmlFor="record-sort">
                Sort records by
              </label>
              <select id="record-sort" name="sort" defaultValue={sort || sortOptions[0].value}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="record-direction">
                Sort direction
              </label>
              <select id="record-direction" name="direction" defaultValue={direction}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </>
          )}
          <button className="btn-primary" type="submit">
            Search
          </button>
          {totalCount !== undefined && <span className="ml-auto text-sm text-slate-500">{totalCount} records</span>}
        </form>
        <div className="data-wrap">
          <table>{children}</table>
        </div>
        <nav aria-label={`${title} pages`} className="panel-header flex items-center justify-between">
          <Link
            aria-disabled={keyset ? !cursor : page <= 1}
            className={(keyset ? !cursor : page <= 1) ? 'pointer-events-none opacity-50' : ''}
            href={
              keyset
                ? previousCursor
                  ? pageHref(Math.max(1, page - 1), previousCursor)
                  : pageHref(1)
                : pageHref(Math.max(1, page - 1))
            }
          >
            Previous
          </Link>
          <span>{keyset ? `Cursor page ${page}` : `Page ${page} of ${totalPages}`}</span>
          <Link
            aria-disabled={keyset ? !nextCursor : page >= totalPages}
            className={(keyset ? !nextCursor : page >= totalPages) ? 'pointer-events-none opacity-50' : ''}
            href={
              keyset ? pageHref(page + 1, nextCursor ?? undefined, cursor) : pageHref(Math.min(totalPages, page + 1))
            }
          >
            Next
          </Link>
        </nav>
      </section>
    </>
  )
}
