"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  RefreshCw,
  Wallet,
  Percent,
  Flame,
  List,
  Hash,
  Calculator,
  Settings2,
  Coins,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { getUserBalance } from "@/lib/auth"
import {
  type ExchangeRateInfo,
  setRateOverride,
  clearRateOverride,
  getRateOverride,
  convertUSDToUAH,
  formatUAH,
  getExchangeRateInfo,
} from "@/lib/currency-converter"
import { cn } from "@/lib/utils"
import { UniversalLoading } from "@/components/loading-states"

type Trade = {
  id: string
  user_id: string
  created_at: string
  profit_loss: number | string
  cryptocurrency: string
  trade_type?: string
}

type Stats = {
  username: string
  avatar_url?: string
  totalTrades: number
  profitableTrades: number
  losingTrades: number
  netPnL: number
  winRate: number
  currentStreak: number
  bestWinStreak: number
  worstLoseStreak: number
  bestTrade: number
  worstTrade: number
  recentTrades: Trade[]
  balance: number
  totalProfit: number
  totalLoss: number
  avgProfit: number
  avgLoss: number
  profitFactor: number
  tradingDays: number
  avgTradesPerDay: number
  mostTradedCoin: string | null
  mostTradedCoinCount: number
}

const n = (v: any) => Number.parseFloat(String(v ?? 0))
const perfColor = (v: number) => (v > 0 ? "text-emerald-400" : v < 0 ? "text-rose-400" : "text-slate-300")

function calcCurrentStreak(tradesNewestFirst: Trade[]) {
  let streak = 0
  for (let i = 0; i < tradesNewestFirst.length; i++) {
    const pnl = n(tradesNewestFirst[i].profit_loss)
    if (i === 0) streak = pnl > 0 ? 1 : pnl < 0 ? -1 : 0
    else {
      if (pnl > 0 && streak > 0) streak++
      else if (pnl < 0 && streak < 0) streak--
      else break
    }
  }
  return streak
}

function calcStreakExtremes(tradesNewestFirst: Trade[]) {
  // Longest consecutive wins and losses
  let bestWin = 0
  let worstLose = 0
  let cw = 0
  let cl = 0
  for (const t of tradesNewestFirst) {
    const pnl = n(t.profit_loss)
    if (pnl > 0) {
      cw += 1
      cl = 0
      if (cw > bestWin) bestWin = cw
    } else if (pnl < 0) {
      cl += 1
      cw = 0
      if (cl > worstLose) worstLose = cl
    } else {
      // Zero PnL breaks both streaks
      cw = 0
      cl = 0
    }
  }
  return { bestWin, worstLose }
}

function calcMostTradedCoin(trades: Trade[]) {
  const counts = new Map<string, number>()
  for (const t of trades) {
    const c = (t.cryptocurrency || "").trim()
    if (!c) continue
    counts.set(c, (counts.get(c) || 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [coin, count] of counts) {
    if (count > bestCount) {
      best = coin
      bestCount = count
    }
  }
  return { coin: best, count: bestCount }
}

function DetailedCard({
  s,
  gradientFrom,
  gradientTo,
  containerBorderClass,
  headerBorderClass,
  rate,
}: {
  s: Stats
  gradientFrom: string
  gradientTo: string
  containerBorderClass: string
  headerBorderClass: string
  rate: number
}) {
  return (
    <Card
      className={cn("rounded-2xl overflow-hidden bg-gradient-to-br", gradientFrom, gradientTo, containerBorderClass)}
    >
      <CardHeader className={cn("p-6", headerBorderClass)}>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-white/10">
            <AvatarImage src={s.avatar_url || "/placeholder.svg?height=56&width=56&query=user"} alt={s.username} />
            <AvatarFallback>{s.username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-white text-2xl font-extrabold">{s.username}</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-300 font-semibold">${s.balance.toFixed(2)}</span>
              <span className="text-blue-300">{formatUAH(convertUSDToUAH(s.balance, rate))}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Primary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-400/20">
            <div className="text-blue-200 text-xs">Всего сделок</div>
            <div className="text-white text-3xl font-extrabold">{s.totalTrades}</div>
          </div>
          <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-400/20">
            <div className="text-emerald-200 text-xs">Прибыльных</div>
            <div className="text-emerald-300 text-3xl font-extrabold">{s.profitableTrades}</div>
          </div>
          <div className="rounded-xl p-4 bg-rose-500/10 border border-rose-400/20">
            <div className="text-rose-200 text-xs">Убыточных</div>
            <div className="text-rose-300 text-3xl font-extrabold">{s.losingTrades}</div>
          </div>
          <div className="rounded-xl p-4 bg-purple-500/10 border border-purple-400/20">
            <div className="text-purple-200 text-xs">Винрейт</div>
            <div className="text-white text-3xl font-extrabold">{s.winRate.toFixed(1)}%</div>
          </div>
          <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-400/20">
            <div className="text-emerald-200 text-xs">Прибыль всего</div>
            <div className="text-emerald-300 text-3xl font-extrabold">+${s.totalProfit.toFixed(2)}</div>
          </div>
          <div className="rounded-xl p-4 bg-rose-500/10 border border-rose-400/20">
            <div className="text-rose-200 text-xs">Убыток всего</div>
            <div className="text-rose-300 text-3xl font-extrabold">-${s.totalLoss.toFixed(2)}</div>
          </div>

          {/* Top coin */}
          <div className="rounded-xl p-4 bg-sky-500/10 border border-sky-400/20 col-span-2 md:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-2 text-sky-200 text-xs">
              <Coins className="w-4 h-4" />
              Топ монета
            </div>
            <div className="text-white text-2xl font-extrabold flex items-baseline gap-3">
              <span>{s.mostTradedCoin || "—"}</span>
              <span className="text-sky-300 text-sm font-semibold">{s.mostTradedCoinCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 bg-emerald-500/10 border border-emerald-400/20">
            <div className="flex items-center justify-between">
              <div className="text-emerald-200 font-medium">Общий P&L</div>
              {s.netPnL >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-300" />
              )}
            </div>
            <div className={cn("text-3xl font-extrabold", perfColor(s.netPnL))}>
              {s.netPnL >= 0 ? "+" : ""}${s.netPnL.toFixed(2)}
            </div>
            <div className="text-blue-300 text-sm">{formatUAH(convertUSDToUAH(s.netPnL, rate))}</div>
          </div>

          <div className="rounded-xl p-5 bg-orange-500/10 border border-orange-400/20">
            <div className="flex items-center gap-2 text-orange-200 font-medium">
              <Flame className="w-4 h-4" />
              Текущая серия
            </div>
            <div
              className={cn(
                "text-3xl font-extrabold",
                s.currentStreak > 0 ? "text-emerald-400" : s.currentStreak < 0 ? "text-rose-400" : "text-slate-300",
              )}
            >
              {s.currentStreak > 0 ? `+${s.currentStreak}` : s.currentStreak}
            </div>
            <div className="mt-2 text-sm text-white/80 flex flex-wrap gap-x-6 gap-y-1">
              <span className="text-emerald-300">Лучшая серия: +{s.bestWinStreak}</span>
              <span className="text-rose-300">Худшая серия: -{s.worstLoseStreak}</span>
            </div>
          </div>
        </div>

        {/* Advanced KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/80 font-semibold">Средняя прибыль</div>
              <Calculator className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-emerald-300 text-2xl font-extrabold">+${s.avgProfit.toFixed(2)}</div>
          </div>
          <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/80 font-semibold">Средний убыток</div>
              <Calculator className="w-4 h-4 text-rose-300" />
            </div>
            <div className="text-rose-300 text-2xl font-extrabold">-${s.avgLoss.toFixed(2)}</div>
          </div>
          <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/80 font-semibold">Profit Factor</div>
              <Calculator className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-yellow-300 text-2xl font-extrabold">
              {s.profitFactor === Number.POSITIVE_INFINITY ? "∞" : s.profitFactor.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
            <div className="text-white/80 font-semibold mb-3">Экстремальные сделки</div>
            <div className="flex items-center justify-between">
              <div className="text-white/70">Лучшая:</div>
              <div className="text-emerald-300 font-bold">+${s.bestTrade.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-white/70">Худшая:</div>
              <div className="text-rose-300 font-bold">${s.worstTrade.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-white/70">Торговых дней:</div>
              <div className="text-white font-semibold">{s.tradingDays}</div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-white/70">Сделок/день:</div>
              <div className="text-white font-semibold">{s.avgTradesPerDay.toFixed(2)}</div>
            </div>
          </div>

          <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-white/80 font-semibold mb-3">
              <List className="w-4 h-4" />
              Последние сделки
            </div>
            <div className="space-y-2">
              {s.recentTrades.length === 0 && <div className="text-white/60 text-sm">Нет данных</div>}
              {s.recentTrades.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md bg-slate-900/60 border border-slate-700/50 px-3 py-2"
                >
                  <div className="text-white/85 text-sm flex items-center gap-2">
                    <span className="font-medium">{t.cryptocurrency}</span>
                    <span className="text-white/50 text-xs">{new Date(t.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <div className={cn("font-bold", perfColor(n(t.profit_loss)))}>
                    {n(t.profit_loss) >= 0 ? "+" : ""}${n(t.profit_loss).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TradingStatistics({ user }: { user: any }) {
  const prefersReducedMotion = useReducedMotion()
  const [view, setView] = useState<"comparison" | "detailed">("comparison")
  const [range, setRange] = useState<"all" | "1y" | "30d" | "7d" | "1d">("all")
  const [me, setMe] = useState<Stats | null>(null)
  const [friend, setFriend] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // Exchange rate state
  const [rateInfo, setRateInfo] = useState<ExchangeRateInfo>({
    rate: 41.5,
    updatedAt: new Date().toISOString(),
    fromOverride: false,
    source: "Fallback",
  })
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideInput, setOverrideInput] = useState<string>(getRateOverride()?.toString() || "")

  // Stable Supabase client
  const supabaseRef = useRef(getSupabaseClient())
  const supabase = supabaseRef.current

  const friendUsername = useMemo(() => {
    if (!user?.username) return null
    return user.username === "RondetOdinn" ? "Chadee" : "RondetOdinn"
  }, [user?.username])

  const periodStartISO = useMemo(() => {
    if (range === "all") return null
    const now = new Date()
    const start = new Date()
    switch (range) {
      case "1y":
        start.setFullYear(now.getFullYear() - 1)
        break
      case "30d":
        start.setDate(now.getDate() - 30)
        break
      case "7d":
        start.setDate(now.getDate() - 7)
        break
      case "1d":
        start.setDate(now.getDate() - 1)
        break
    }
    return start.toISOString()
  }, [range])

  const computeStats = (username: string, avatar_url: string | undefined, trades: Trade[], balance: number): Stats => {
    const totalTrades = trades.length
    const profitableTrades = trades.filter((t) => n(t.profit_loss) > 0).length
    const losingTrades = trades.filter((t) => n(t.profit_loss) < 0).length
    const totalProfit = trades.filter((t) => n(t.profit_loss) > 0).reduce((s, t) => s + n(t.profit_loss), 0)
    const totalLoss = Math.abs(trades.filter((t) => n(t.profit_loss) < 0).reduce((s, t) => s + n(t.profit_loss), 0))
    const netPnL = totalProfit - totalLoss
    const winRate = totalTrades ? (profitableTrades / totalTrades) * 100 : 0
    const bestTrade = totalTrades ? Math.max(...trades.map((t) => n(t.profit_loss))) : 0
    const worstTrade = totalTrades ? Math.min(...trades.map((t) => n(t.profit_loss))) : 0
    const currentStreak = calcCurrentStreak(trades)
    const { bestWin, worstLose } = calcStreakExtremes(trades)
    const avgProfit = profitableTrades ? totalProfit / profitableTrades : 0
    const avgLoss = losingTrades ? totalLoss / losingTrades : 0
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Number.POSITIVE_INFINITY : 0

    const dates = [...new Set(trades.map((t) => new Date(t.created_at).toDateString()))]
    const tradingDays = dates.length
    const avgTradesPerDay = tradingDays ? totalTrades / tradingDays : 0

    const { coin, count } = calcMostTradedCoin(trades)

    return {
      username,
      avatar_url,
      totalTrades,
      profitableTrades,
      losingTrades,
      netPnL,
      winRate,
      currentStreak,
      bestWinStreak: bestWin,
      worstLoseStreak: worstLose,
      bestTrade,
      worstTrade,
      recentTrades: trades.slice(0, 8),
      balance,
      totalProfit,
      totalLoss,
      avgProfit,
      avgLoss,
      profitFactor,
      tradingDays,
      avgTradesPerDay,
      mostTradedCoin: coin,
      mostTradedCoinCount: count,
    }
  }

  const toStats = useCallback(
    async (row: { id: string; username: string; avatar_url?: string }): Promise<Stats> => {
      let q = supabase
        .from("crypto_journal")
        .select("id,user_id,created_at,profit_loss,cryptocurrency,trade_type")
        .eq("user_id", row.id)
        .eq("trade_type", "trade")
        .order("created_at", { ascending: false })

      if (periodStartISO) q = q.gte("created_at", periodStartISO)

      const { data: tradesRaw, error } = await q
      if (error) throw error
      const trades = (tradesRaw as unknown as Trade[]) || []

      const balance = await getUserBalance(row.id)
      return computeStats(row.username, row.avatar_url, trades, balance)
    },
    [periodStartISO, supabase],
  )

  const load = useCallback(async () => {
    if (!user?.username) return
    try {
      setLoading(true)

      // Accurate USD→UAH rate (cached + multi-source + override support)
      const r = await getExchangeRateInfo()
      setRateInfo(r)

      // Me
      const { data: meRow } = await supabase
        .from("users")
        .select("id,username,avatar_url")
        .eq("username", user.username)
        .single()
      if (meRow) {
        const s = await toStats(meRow)
        setMe(s)
      }

      // Friend
      if (friendUsername) {
        const { data: frRow } = await supabase
          .from("users")
          .select("id,username,avatar_url")
          .eq("username", friendUsername)
          .single()
        if (frRow) {
          const fs = await toStats(frRow)
          setFriend(fs)
        } else {
          setFriend(null)
        }
      } else {
        setFriend(null)
      }
    } catch {
      // Safe fallbacks
      if (!me) {
        setMe({
          username: user?.username || "Вы",
          totalTrades: 0,
          profitableTrades: 0,
          losingTrades: 0,
          netPnL: 0,
          winRate: 0,
          currentStreak: 0,
          bestWinStreak: 0,
          worstLoseStreak: 0,
          bestTrade: 0,
          worstTrade: 0,
          recentTrades: [],
          balance: 0,
          totalProfit: 0,
          totalLoss: 0,
          avgProfit: 0,
          avgLoss: 0,
          profitFactor: 0,
          tradingDays: 0,
          avgTradesPerDay: 0,
          mostTradedCoin: null,
          mostTradedCoinCount: 0,
        })
      }
      if (!friend && friendUsername) {
        setFriend({
          username: friendUsername,
          totalTrades: 0,
          profitableTrades: 0,
          losingTrades: 0,
          netPnL: 0,
          winRate: 0,
          currentStreak: 0,
          bestWinStreak: 0,
          worstLoseStreak: 0,
          bestTrade: 0,
          worstTrade: 0,
          recentTrades: [],
          balance: 0,
          totalProfit: 0,
          totalLoss: 0,
          avgProfit: 0,
          avgLoss: 0,
          profitFactor: 0,
          tradingDays: 0,
          avgTradesPerDay: 0,
          mostTradedCoin: null,
          mostTradedCoinCount: 0,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [friendUsername, me, supabase, toStats, user?.username])

  // Load on mount/range change
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username, range])

  // Refresh rate every 10 minutes (without reloading stats)
  useEffect(() => {
    let alive = true
    async function refreshRate() {
      try {
        const info = await getExchangeRateInfo()
        if (alive) setRateInfo(info)
      } catch {}
    }
    const id = setInterval(refreshRate, 10 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // Manual override handlers
  const applyOverride = () => {
    const v = Number(overrideInput)
    if (Number.isFinite(v) && v > 0) {
      setRateOverride(v)
      setRateInfo({ rate: v, updatedAt: new Date().toISOString(), fromOverride: true, source: "Override" })
      setOverrideOpen(false)
    }
  }

  const resetOverride = async () => {
    clearRateOverride()
    const fresh = await getExchangeRateInfo(true)
    setRateInfo(fresh)
    setOverrideInput("")
    setOverrideOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <UniversalLoading title="Загрузка статистики..." subtitle="Подготавливаем торговые метрики и курс UAH" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="rounded-2xl p-4 md:p-6 bg-gradient-to-br from-slate-900/70 via-purple-900/40 to-fuchsia-900/30 border border-purple-500/30 backdrop-blur-xl shadow-xl shadow-purple-500/10 mb-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/25 to-pink-500/25 border border-purple-400/30">
              <BarChart3 className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                Торговая Статистика
              </h3>
              <div className="text-white/70 text-sm">Подробный анализ. Точный курс UAH.</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* USD/UAH display with override and timestamp */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
              <span className="text-xs text-white/70">USD/UAH</span>
              <Badge
                className={cn(
                  "rounded-md text-white border-emerald-500",
                  rateInfo.fromOverride ? "bg-amber-600" : "bg-emerald-600",
                )}
              >
                {rateInfo.rate.toFixed(3)} ₴
              </Badge>
              <span className="text-[11px] text-white/50">
                {new Date(rateInfo.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white/70 hover:text-white"
                onClick={async () => setRateInfo(await getExchangeRateInfo(true))}
                title="Обновить курс"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Popover open={overrideOpen} onOpenChange={setOverrideOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/70 hover:text-white"
                    title="Ручная настройка курса"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 bg-slate-900 border-slate-700">
                  <div className="space-y-3">
                    <div className="text-white/80 text-sm font-medium">Ручной курс USD→UAH</div>
                    <Input
                      inputMode="decimal"
                      placeholder="Напр. 41.85"
                      value={overrideInput}
                      onChange={(e) => setOverrideInput(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <div className="flex items-center gap-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={applyOverride}>
                        Применить
                      </Button>
                      <Button
                        variant="secondary"
                        className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
                        onClick={resetOverride}
                      >
                        Сбросить
                      </Button>
                    </div>
                    <div className="text-[11px] text-white/50">Источник: Google Finance</div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Select value={range} onValueChange={(v: any) => setRange(v)}>
              <SelectTrigger className="w-[130px] h-9 bg-slate-800/60 border-slate-700/60 text-white rounded-lg">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="1y">1 год</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="1d">1 день</SelectItem>
              </SelectContent>
            </Select>

            {/* Aligned segmented control */}
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => v && setView(v as typeof view)}
              className="inline-flex items-center p-1 gap-1 bg-slate-800/40 border border-slate-700/60 rounded-xl"
            >
              <ToggleGroupItem
                value="comparison"
                aria-label="Сравнение"
                className={cn(
                  "h-9 px-4 text-xs rounded-lg transition-colors",
                  "data-[state=on]:bg-blue-600 data-[state=on]:text-white",
                  "data-[state=off]:text-white/70 hover:bg-white/10",
                )}
              >
                <Users className="w-4 h-4 mr-1" />
                Сравнение
              </ToggleGroupItem>
              <ToggleGroupItem
                value="detailed"
                aria-label="Детально"
                className={cn(
                  "h-9 px-4 text-xs rounded-lg transition-colors",
                  "data-[state=on]:bg-purple-600 data-[state=on]:text-white",
                  "data-[state=off]:text-white/70 hover:bg-white/10",
                )}
              >
                Детально
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "comparison" ? (
          <motion.div
            key="cmp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-5"
          >
            {/* Me */}
            {me && (
              <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-purple-900/30 border border-purple-500/30 rounded-2xl overflow-hidden">
                <CardHeader className="p-5 border-b border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 ring-2 ring-purple-400/20">
                      <AvatarImage
                        src={me.avatar_url || "/placeholder.svg?height=44&width=44&query=user"}
                        alt={me.username}
                      />
                      <AvatarFallback>{me.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg font-bold">{me.username}</CardTitle>
                      <div className="flex items-center gap-2 text-xs">
                        <Wallet className="w-3 h-3 text-emerald-300" />
                        <span className="text-emerald-300 font-semibold">${me.balance.toFixed(2)}</span>
                        <span className="text-blue-300">{formatUAH(convertUSDToUAH(me.balance, rateInfo.rate))}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 bg-blue-500/10 border border-blue-400/20">
                      <div className="flex items-center gap-2 text-blue-200 text-xs">
                        <Hash className="w-3 h-3" />
                        Всего сделок
                      </div>
                      <div className="text-white text-xl font-extrabold">{me.totalTrades}</div>
                    </div>
                    <div className="rounded-lg p-3 bg-purple-500/10 border border-purple-400/20">
                      <div className="flex items-center gap-2 text-purple-200 text-xs">
                        <Percent className="w-3 h-3" />
                        Винрейт
                      </div>
                      <div className="text-white text-xl font-extrabold">{me.winRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Top coin */}
                  <div className="rounded-lg p-3 bg-sky-500/10 border border-sky-400/20">
                    <div className="flex items-center gap-2 text-sky-200 text-xs">
                      <Coins className="w-3 h-3" />
                      Топ монета
                    </div>
                    <div className="text-white text-xl font-extrabold flex items-baseline gap-2">
                      <span>{me.mostTradedCoin || "—"}</span>
                      <span className="text-sky-300 text-sm font-semibold">{me.mostTradedCoinCount}</span>
                    </div>
                  </div>

                  <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-400/20">
                    <div className="flex items-center justify-between">
                      <div className="text-emerald-200 text-sm font-medium">Общий P&L</div>
                      {me.netPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-rose-300" />
                      )}
                    </div>
                    <div className={cn("text-xl font-extrabold", perfColor(me.netPnL))}>
                      {me.netPnL >= 0 ? "+" : ""}${me.netPnL.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-400/20">
                    <div className="flex items-center gap-2 text-orange-200 text-sm font-medium">
                      <Flame className="w-4 h-4" />
                      Текущая серия
                    </div>
                    <div
                      className={cn(
                        "text-lg font-extrabold",
                        me.currentStreak > 0
                          ? "text-emerald-400"
                          : me.currentStreak < 0
                            ? "text-rose-400"
                            : "text-slate-300",
                      )}
                    >
                      {me.currentStreak > 0 ? `+${me.currentStreak}` : me.currentStreak}
                    </div>
                    <div className="mt-1 text-[13px] text-white/80 flex gap-4">
                      <span className="text-emerald-300">Лучшая: +{me.bestWinStreak}</span>
                      <span className="text-rose-300">Худшая: -{me.worstLoseStreak}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Friend */}
            {friend && (
              <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-cyan-900/30 border border-cyan-500/30 rounded-2xl overflow-hidden">
                <CardHeader className="p-5 border-b border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 ring-2 ring-cyan-400/20">
                      <AvatarImage
                        src={friend.avatar_url || "/placeholder.svg?height=44&width=44&query=user"}
                        alt={friend.username}
                      />
                      <AvatarFallback>{friend.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg font-bold">{friend.username}</CardTitle>
                      <div className="flex items-center gap-2 text-xs">
                        <Wallet className="w-3 h-3 text-emerald-300" />
                        <span className="text-emerald-300 font-semibold">${friend.balance.toFixed(2)}</span>
                        <span className="text-blue-300">
                          {formatUAH(convertUSDToUAH(friend.balance, rateInfo.rate))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 bg-blue-500/10 border border-blue-400/20">
                      <div className="flex items-center gap-2 text-blue-200 text-xs">
                        <Hash className="w-3 h-3" />
                        Всего сделок
                      </div>
                      <div className="text-white text-xl font-extrabold">{friend.totalTrades}</div>
                    </div>
                    <div className="rounded-lg p-3 bg-purple-500/10 border border-purple-400/20">
                      <div className="flex items-center gap-2 text-purple-200 text-xs">
                        <Percent className="w-3 h-3" />
                        Винрейт
                      </div>
                      <div className="text-white text-xl font-extrabold">{friend.winRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Top coin */}
                  <div className="rounded-lg p-3 bg-sky-500/10 border border-sky-400/20">
                    <div className="flex items-center gap-2 text-sky-200 text-xs">
                      <Coins className="w-3 h-3" />
                      Топ монета
                    </div>
                    <div className="text-white text-xl font-extrabold flex items-baseline gap-2">
                      <span>{friend.mostTradedCoin || "—"}</span>
                      <span className="text-sky-300 text-sm font-semibold">{friend.mostTradedCoinCount}</span>
                    </div>
                  </div>

                  <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-400/20">
                    <div className="flex items-center justify-between">
                      <div className="text-emerald-200 text-sm font-medium">Общий P&L</div>
                      {friend.netPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-rose-300" />
                      )}
                    </div>
                    <div className={cn("text-xl font-extrabold", perfColor(friend.netPnL))}>
                      {friend.netPnL >= 0 ? "+" : ""}${friend.netPnL.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-400/20">
                    <div className="flex items-center gap-2 text-orange-200 text-sm font-medium">
                      <Flame className="w-4 h-4" />
                      Текущая серия
                    </div>
                    <div
                      className={cn(
                        "text-lg font-extrabold",
                        friend.currentStreak > 0
                          ? "text-emerald-400"
                          : friend.currentStreak < 0
                            ? "text-rose-400"
                            : "text-slate-300",
                      )}
                    >
                      {friend.currentStreak > 0 ? `+${friend.currentStreak}` : friend.currentStreak}
                    </div>
                    <div className="mt-1 text-[13px] text-white/80 flex gap-4">
                      <span className="text-emerald-300">Лучшая: +{friend.bestWinStreak}</span>
                      <span className="text-rose-300">Худшая: -{friend.worstLoseStreak}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="det"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="space-y-6"
          >
            {/* Detailed for me */}
            {me && (
              <DetailedCard
                s={me}
                gradientFrom="from-slate-900/70 via-slate-900/60"
                gradientTo="to-purple-900/30"
                containerBorderClass="border border-purple-500/30"
                headerBorderClass="border-b border-purple-500/20"
                rate={rateInfo.rate}
              />
            )}

            {/* Detailed for friend — identical layout/metrics */}
            {friend && (
              <DetailedCard
                s={friend}
                gradientFrom="from-slate-900/70 via-slate-900/60"
                gradientTo="to-cyan-900/30"
                containerBorderClass="border border-cyan-500/30"
                headerBorderClass="border-b border-cyan-500/20"
                rate={rateInfo.rate}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
