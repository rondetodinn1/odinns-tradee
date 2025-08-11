export default function NewsLoading() {
  return (
    <div className="min-h-[80vh] w-full py-6 px-4 md:px-6 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950">
      <div className="mx-auto w-full max-w-6xl">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-72 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-9 w-64 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-9 w-56 rounded bg-white/10 animate-pulse" />
            <div className="h-9 w-64 rounded bg-white/10 animate-pulse" />
            <div className="h-[560px] w-full rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-4 w-80 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
