"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Newspaper } from "lucide-react"

// Client-only dynamic import is allowed here.
const EconomicCalendarWidget = dynamic(() => import("./economic-calendar-widget"), {
  ssr: false,
  loading: () => (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 border border-purple-500/25">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-400/30">
            <Newspaper className="h-5 w-5 text-purple-300" />
          </div>
          <CardTitle className="text-white/90">Новости и события</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-9 w-60 bg-white/10" />
          <Skeleton className="h-9 w-72 bg-white/10" />
          <div className="h-[420px] w-full rounded-xl bg-white/5 border border-white/10" />
        </div>
      </CardContent>
    </Card>
  ),
})

export default function NewsCalendarClient() {
  return <EconomicCalendarWidget />
}

// Also export named for convenience if anything imports it this way.
export { NewsCalendarClient }
