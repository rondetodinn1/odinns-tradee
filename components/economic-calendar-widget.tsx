"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Period = "week"

function iso(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Monday → Sunday range for the current week
function getWeekRange() {
  const now = new Date()
  const offsetToMonday = (now.getDay() + 6) % 7 // 0 for Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - offsetToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { from: iso(monday), to: iso(sunday) }
}

function fixedHeight(period: Period) {
  if (period === "week") return 800
  return 600
}

export default function EconomicCalendarWidget(props: { height?: number; maxWidth?: number } = {}) {
  const period: Period = "week"
  const [reloadTick, setReloadTick] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const range = useMemo(() => getWeekRange(), [reloadTick])
  const height = props.height ?? 600

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      columns:
        "exc_flags,exc_country,exc_importance,exc_time,exc_currency,exc_event,exc_actual,exc_forecast,exc_previous",
      importance: "3",
      lang: "7",
      features: "datepicker,timezone,filters",
      dateFrom: range.from,
      dateTo: range.to,
      theme: "dark",
    })
    return `https://sslecal2.forexprostools.com/?${params.toString()}`
  }, [range.from, range.to])

  useEffect(() => {
    setLoaded(false)
    setBlocked(false)
    const t = setTimeout(() => {
      if (!loaded) setBlocked(true)
    }, 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeSrc])

  const label = "Экономический календарь: Неделя"
  const subLabel = `${range.from} — ${range.to}`

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-slate-900/70 border border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white">
              <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15 border border-violet-400/20">
                <CalendarDays className="h-3 w-3 text-violet-300" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-white/60">{subLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800"
                onClick={() => setReloadTick((t) => t + 1)}
                title="Обновить"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="relative w-full" style={{ height }}>
            {!blocked && (
              <iframe
                key={`${period}-${range.from}-${range.to}-${reloadTick}`}
                title="investing-economic-calendar-week"
                src={iframeSrc}
                className="w-full h-full block"
                frameBorder={0}
                scrolling="yes"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => setLoaded(true)}
              />
            )}

            {(blocked || !loaded) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/85 text-center px-4">
                <p className="text-white/90 text-sm">
                  Виджет календаря не загрузился. Возможна блокировка содержимого.
                </p>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                  onClick={() => {
                    setBlocked(false)
                    setReloadTick((t) => t + 1)
                  }}
                >
                  Обновить
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { EconomicCalendarWidget }
