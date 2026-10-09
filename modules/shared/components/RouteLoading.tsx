export default function RouteLoading() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-5 animate-pulse">
      <div className="h-8 w-56 rounded-xl bg-slate-200/80" />
      <div className="h-4 w-80 rounded-lg bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
      </div>
      <div className="h-72 rounded-2xl bg-slate-100" />
    </div>
  )
}
