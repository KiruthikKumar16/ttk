export function ReportExport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const query = new URLSearchParams({ startDate, endDate })
  return (
    <a className="btn-primary inline-flex min-h-10 items-center" href={`/api/reports/export?${query}`} download>
      Download CSV
    </a>
  )
}
