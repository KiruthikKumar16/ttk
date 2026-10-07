export function ReportExport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const query = new URLSearchParams({ startDate, endDate })
  return (
    <a
      className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90"
      style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
      href={`/api/reports/export?${query}`}
      download
    >
      Download CSV
    </a>
  )
}
