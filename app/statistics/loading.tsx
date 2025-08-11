export default function StatisticsLoading() {
  return (
    <div className="min-h-[80vh] w-full py-6 px-4 md:px-6 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-80 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-9 w-28 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>

        <div className="h-[420px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        <div className="h-[320px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
      </div>
    </div>
  )
}
