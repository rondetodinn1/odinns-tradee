"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  trades: any[]
  className?: string
  title?: string
}

function normalizeSymbol(v: unknown): string {
  if (typeof v === "string") return v.trim().toUpperCase()
  return "UNKNOWN"
}

function getOutcome(t: any): "win" | "loss" | "breakeven" {
  const res = typeof t?.result === "string" ? t.result.toLowerCase() : undefined
  if (res === "win") return "win"
  if (res === "loss") return "loss"
  // derive by numeric profit fields
  const n =
    typeof t?.profit === "number"
      ? t.profit
      : typeof t?.pnl === "number"
        ? t.pnl
        : typeof t?.pl === "number"
          ? t.pl
          : Number.isFinite(Number.parseFloat(t?.profit))
            ? Number.parseFloat(t?.profit)
            : 0
  if (n > 0) return "win"
  if (n < 0) return "loss"
  return "breakeven"
}

function getDate(t: any): number {
  const d = t?.closedAt ?? t?.closeTime ?? t?.date ?? t?.createdAt ?? t?.updatedAt
  const ts = typeof d === "string" || typeof d === "number" ? new Date(d).getTime() : Date.now()
  return Number.isFinite(ts) ? ts : Date.now()
}

function computeTopSymbol(trades: any[]) {
  const counts = new Map<string, number>()
  for (const t of trades) {
    const s = normalizeSymbol(t?.symbol ?? t?.coin ?? t?.pair ?? t?.ticker)
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  let top: { symbol: string; count: number } = { symbol: "—", count: 0 }
  for (const [s, c] of counts.entries()) {
    if (c > top.count && s !== "UNKNOWN") top = { symbol: s, count: c }
  }
  return top
}

function computeStreaks(trades: any[]) {
  // Sort by time ascending to compute streaks chronologically
  const sorted = [...trades].sort((a, b) => getDate(a) - getDate(b))
  let bestWin = 0
  let worstLoss = 0
  let curWin = 0
  let curLoss = 0

  for (const t of sorted) {
    const o = getOutcome(t)
    if (o === "win") {
      curWin += 1
      curLoss = 0
    } else if (o === "loss") {
      curLoss += 1
      curWin = 0
    } else {
      // breakeven breaks both streaks
      curWin = 0
      curLoss = 0
    }
    if (curWin > bestWin) bestWin = curWin
    if (curLoss > worstLoss) worstLoss = curLoss
  }

  return { bestWin, worstLoss }
}

export function StatisticsExtras({ trades, className, title = "Дополнительные метрики" }: Props) {
  const { symbol, count } = useMemo(() => computeTopSymbol(trades ?? []), [trades])
  const { bestWin, worstLoss } = useMemo(() => computeStreaks(trades ?? []), [trades])

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 border border-purple-500/25">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-purple-300" />
            <CardTitle className="text-sm text-white/90">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-white/70 text-sm">Монета с наибольшим числом сделок</div>
            <Badge className="bg-purple-600 text-white">{symbol}</Badge>
          </div>
          <div className="mt-2 text-xs text-white/60">Всего сделок по монете: {count}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 border border-purple-500/25">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-300" />
            <CardTitle className="text-sm text-white/90">Серии (лучшие/худшие)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Лучшая серия</span>
            </div>
            <Badge className="bg-emerald-600/30 text-emerald-200 border-emerald-500/30">{bestWin}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-300">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">Худшая серия</span>
            </div>
            <Badge className="bg-red-600/30 text-red-200 border-red-500/30">{worstLoss}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatisticsExtras
