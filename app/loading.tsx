export default function RootLoading() {
  return (
    <div className="min-h-[80vh] w-full py-6 px-4 md:px-6 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
