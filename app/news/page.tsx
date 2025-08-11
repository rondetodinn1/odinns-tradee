import EconomicCalendarWidget from "@/components/economic-calendar-widget"

export const metadata = {
  title: "Новости",
}

export default function NewsPage() {
  return (
    <main className="w-full px-1 sm:px-2 py-2">
      <div className="w-full space-y-2">
        <div className="px-1">
          <h1 className="text-lg sm:text-xl font-semibold text-white/90">Новости и экономический календарь</h1>
          <p className="text-xs text-white/60 mt-0.5">События наивысшей важности на текущую неделю.</p>
        </div>
        <EconomicCalendarWidget />
      </div>
    </main>
  )
}
