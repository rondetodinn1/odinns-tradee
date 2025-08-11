"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseClient } from "@/lib/supabase"
import { getUserStats } from "@/lib/auth"
import { convertUSDToUAH, formatUAH, getExchangeRateInfo } from "@/lib/currency-converter"
import { motion } from "framer-motion"
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  Database,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Globe,
  Clock,
  TrendingDown,
  Shield,
  Activity,
  Zap,
} from "lucide-react"
import { UniversalLoading } from "@/components/loading-states"

interface DashboardStats {
  totalPnL: number
  totalTrades: number
  winRate: number
  bestTrade: number
  todayPnL: number
  todayTrades: number
  balance: number
}

interface DataSourceStatus {
  name: string
  status: "connected" | "disconnected" | "slow"
  lastUpdate: string
  icon: any
  color: string
}

interface MarketData {
  bitcoin: { price: number; change24h: number; volume24h: number }
  ethereum: { price: number; change24h: number; volume24h: number }
  solana: { price: number; change24h: number; volume24h: number }
  avalanche: { price: number; change24h: number; volume24h: number }
  dogwifcoin: { price: number; change24h: number; volume24h: number }
  popcat: { price: number; change24h: number; volume24h: number }
  pepe: { price: number; change24h: number; volume24h: number }
  uniswap: { price: number; change24h: number; volume24h: number }
  ai16z: { price: number; change24h: number; volume24h: number }
  totalVolume: number
}

export function ImprovedDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    bestTrade: 0,
    todayPnL: 0,
    todayTrades: 0,
    balance: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [isMarketLoading, setIsMarketLoading] = useState(true)
  const [marketError, setMarketError] = useState<string | null>(null)
  const [dataSourcesStatus, setDataSourcesStatus] = useState<DataSourceStatus[]>([
    {
      name: "База Данных",
      status: "connected",
      lastUpdate: new Date().toLocaleTimeString(),
      icon: Database,
      color: "text-green-400",
    },
    {
      name: "Рыночные Данные",
      status: "connected",
      lastUpdate: new Date().toLocaleTimeString(),
      icon: Globe,
      color: "text-blue-400",
    },
    {
      name: "Система",
      status: "connected",
      lastUpdate: new Date().toLocaleTimeString(),
      icon: Wifi,
      color: "text-green-400",
    },
  ])
  const [usdToUahRate, setUsdToUahRate] = useState(41.5)
  const [lastRateUpdate, setLastRateUpdate] = useState<Date | null>(null)
  const [rateSource, setRateSource] = useState<string>("fallback")

  const [systemHealth, setSystemHealth] = useState({
    database: { status: "checking", response_time: 0 },
    api: { status: "checking", response_time: 0 },
    market_data: { status: "checking", response_time: 0 },
  })
  const [overallPerformance, setOverallPerformance] = useState("checking")
  const [pingTime, setPingTime] = useState<number>(0)

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchDashboardData()
    fetchMarketData()
    loadExchangeRate()
    checkSystemHealth()

    const interval = setInterval(() => {
      updateDataSourcesStatus()
      fetchMarketData()
      loadExchangeRate()
      checkSystemHealth()
    }, 300000)

    return () => clearInterval(interval)
  }, [user?.id])

  const loadExchangeRate = async () => {
    try {
      const rateInfo = await getExchangeRateInfo()
      setUsdToUahRate(rateInfo.rate)
      setRateSource(rateInfo.source)
      setLastRateUpdate(new Date())
    } catch (error) {
      console.error("❌ Ошибка обновления курса:", error)
    }
  }

  const updateDataSourcesStatus = () => {
    setDataSourcesStatus((prev) =>
      prev.map((source) => ({
        ...source,
        lastUpdate: source.status !== "disconnected" ? new Date().toLocaleTimeString() : source.lastUpdate,
      })),
    )
  }

  const fetchMarketData = async () => {
    try {
      setIsMarketLoading(true)
      setMarketError(null)

      const response = await fetch("/api/real-market-data")

      if (response.ok) {
        const result = await response.json()

        if (result.success) {
          // Добавляем новые монеты к существующим данным
          const updatedData = {
            ...result.data,
            pepe: result.data.pepe || { price: 0.000018, change24h: 5.2, volume24h: 45000000 },
            uniswap: result.data.uniswap || { price: 12.45, change24h: -2.1, volume24h: 125000000 },
            ai16z: result.data.ai16z || { price: 0.85, change24h: 15.7, volume24h: 8500000 },
          }

          // Replace jupiter with popcat if exists
          if (updatedData.jupiter) {
            updatedData.popcat = updatedData.jupiter
            delete updatedData.jupiter
          }

          setMarketData(updatedData)
          // Обновляем статус источника данных
          setDataSourcesStatus((prev) =>
            prev.map((source) =>
              source.name === "Рыночные Данные"
                ? {
                    ...source,
                    status: "connected",
                    color: "text-green-400",
                    lastUpdate: new Date().toLocaleTimeString(),
                  }
                : source,
            ),
          )
        } else {
          throw new Error(result.error || "Failed to fetch market data")
        }
      } else {
        throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching market data:", error)
      setMarketError(error instanceof Error ? error.message : "Unknown error")

      // Обновляем статус источника данных на ошибку
      setDataSourcesStatus((prev) =>
        prev.map((source) =>
          source.name === "Рыночные Данные" ? { ...source, status: "disconnected", color: "text-red-400" } : source,
        ),
      )
    } finally {
      setIsMarketLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Calculate balance from balance_entries
      const { data: balanceEntries } = await supabase
        .from("balance_entries")
        .select("amount, type")
        .eq("user_id", user.id)

      let calculatedBalance = 0
      if (balanceEntries) {
        const income = balanceEntries
          .filter((entry) => ["deposit", "trade_profit", "income"].includes(entry.type))
          .reduce((sum, entry) => sum + entry.amount, 0)

        const expenses = balanceEntries
          .filter((entry) => ["withdrawal", "trade_loss", "expense"].includes(entry.type))
          .reduce((sum, entry) => sum + entry.amount, 0)

        calculatedBalance = income - expenses
      }

      // Update user balance in database
      await supabase.from("users").update({ balance: calculatedBalance }).eq("id", user.id)

      const [userStats] = await Promise.all([getUserStats(user.id)])

      // Get today's TRADING operations only (trade_type === "trade")
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data: todayTrades } = await supabase
        .from("crypto_journal")
        .select("profit_loss")
        .eq("user_id", user.id)
        .eq("trade_type", "trade")
        .gte("created_at", startOfDay.toISOString())
        .lt("created_at", endOfDay.toISOString())

      const todayPnL = todayTrades?.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0) || 0
      const todayTradesCount = todayTrades?.length || 0

      setStats({
        ...userStats,
        balance: calculatedBalance,
        todayPnL,
        todayTrades: todayTradesCount,
      })
    } catch (error) {
      console.error("Ошибка загрузки данных дашборда:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "slow":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "disconnected":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <Database className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Подключено"
      case "slow":
        return "Медленно"
      case "disconnected":
        return "Отключено"
      default:
        return "Неизвестно"
    }
  }

  const formatLargeNumber = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`
    }
    return `$${value.toLocaleString()}`
  }

  const checkSystemHealth = async () => {
    const startTime = Date.now()

    try {
      // Измеряем ping
      const pingStart = Date.now()
      await fetch("/api/health").catch(() => null)
      const pingEnd = Date.now()
      setPingTime(pingEnd - pingStart)

      // Проверяем базу данных
      const dbStart = Date.now()
      const { error: dbError } = await supabase.from("users").select("id").limit(1)
      const dbResponseTime = Date.now() - dbStart

      // Проверяем API
      const apiStart = Date.now()
      const healthResponse = await fetch("/api/health").catch(() => null)
      const apiResponseTime = Date.now() - apiStart

      // Проверяем рыночные данные
      const marketStart = Date.now()
      const marketResponse = await fetch("/api/real-market-data").catch(() => null)
      const marketResponseTime = Date.now() - marketStart

      const newSystemHealth = {
        database: {
          status: dbError ? "error" : dbResponseTime > 1000 ? "slow" : "healthy",
          response_time: dbResponseTime,
        },
        api: {
          status: !healthResponse ? "error" : apiResponseTime > 2000 ? "slow" : "healthy",
          response_time: apiResponseTime,
        },
        market_data: {
          status: !marketResponse ? "error" : marketResponseTime > 3000 ? "slow" : "healthy",
          response_time: marketResponseTime,
        },
      }

      setSystemHealth(newSystemHealth)

      // Определяем общую производительность
      const statuses = Object.values(newSystemHealth).map((s) => s.status)
      if (statuses.includes("error")) {
        setOverallPerformance("Проблемы")
      } else if (statuses.includes("slow")) {
        setOverallPerformance("Медленно")
      } else {
        setOverallPerformance("Отлично")
      }

      // Обновляем статусы источников данных
      setDataSourcesStatus([
        {
          name: "База Данных",
          status:
            newSystemHealth.database.status === "healthy"
              ? "connected"
              : newSystemHealth.database.status === "slow"
                ? "slow"
                : "disconnected",
          lastUpdate: new Date().toLocaleTimeString(),
          icon: Database,
          color:
            newSystemHealth.database.status === "healthy"
              ? "text-green-400"
              : newSystemHealth.database.status === "slow"
                ? "text-yellow-400"
                : "text-red-400",
        },
        {
          name: "Рыночные Данные",
          status:
            newSystemHealth.market_data.status === "healthy"
              ? "connected"
              : newSystemHealth.market_data.status === "slow"
                ? "slow"
                : "disconnected",
          lastUpdate: new Date().toLocaleTimeString(),
          icon: Globe,
          color:
            newSystemHealth.market_data.status === "healthy"
              ? "text-green-400"
              : newSystemHealth.market_data.status === "slow"
                ? "text-yellow-400"
                : "text-red-400",
        },
        {
          name: "Система",
          status:
            newSystemHealth.api.status === "healthy"
              ? "connected"
              : newSystemHealth.api.status === "slow"
                ? "slow"
                : "disconnected",
          lastUpdate: new Date().toLocaleTimeString(),
          icon: Wifi,
          color:
            newSystemHealth.api.status === "healthy"
              ? "text-green-400"
              : newSystemHealth.api.status === "slow"
                ? "text-yellow-400"
                : "text-red-400",
        },
      ])
    } catch (error) {
      console.error("System health check failed:", error)
      setOverallPerformance("Ошибка")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <UniversalLoading title="Загрузка панели..." subtitle="Подготавливаем вашу сводку и рыночные данные" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950">
      <div className="w-full space-y-4 p-4 md:p-6">
        {/* Quick Stats */}
        <div className="w-full grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Общий P&L",
              value: `$${stats.totalPnL.toFixed(2)}`,
              subtitle: formatUAH(convertUSDToUAH(stats.totalPnL, usdToUahRate)),
              icon: DollarSign,
              color: stats.totalPnL >= 0 ? "green" : "red",
              delay: 0,
            },
            {
              title: "P&L Сегодня",
              value: `$${stats.todayPnL.toFixed(2)}`,
              subtitle: formatUAH(convertUSDToUAH(stats.todayPnL, usdToUahRate)),
              icon: TrendingUp,
              color: stats.todayPnL >= 0 ? "green" : "red",
              delay: 0.1,
            },
            {
              title: "Всего Сделок",
              value: stats.totalTrades,
              subtitle: `${stats.winRate.toFixed(1)}% успешных`,
              icon: BarChart3,
              color: "purple",
              delay: 0.2,
            },
            {
              title: "Лучшая Сделка",
              value: `$${stats.bestTrade.toFixed(2)}`,
              subtitle: formatUAH(convertUSDToUAH(stats.bestTrade, usdToUahRate)),
              icon: Target,
              color: "orange",
              delay: 0.3,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: stat.delay }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer`}
            >
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                  <CardTitle className="text-sm font-medium text-white/80">{stat.title}</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-lg border border-purple-500/30">
                    <stat.icon className="h-5 w-5 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div
                    className={`text-xl font-bold ${
                      stat.color === "green"
                        ? "text-green-400"
                        : stat.color === "red"
                          ? "text-red-400"
                          : stat.color === "orange"
                            ? "text-orange-400"
                            : "text-white"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <p className="text-xs text-purple-300 font-medium">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
        >
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="text-white/90 flex items-center justify-between text-xl">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-lg border border-purple-500/30 mr-3">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="hidden sm:inline">Обзор Криптовалютного Рынка</span>
                  <span className="sm:hidden">Рынок</span>
                </div>
                {marketError && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/20">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Ошибка API</span>
                    <span className="sm:hidden">Ошибка</span>
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {isMarketLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="bg-slate-700/30 border-slate-600/50 rounded-xl p-4 animate-pulse"
                    >
                      <div className="h-4 bg-purple-500/20 rounded mb-2"></div>
                      <div className="h-6 bg-purple-500/20 rounded mb-1"></div>
                      <div className="h-3 bg-purple-500/20 rounded"></div>
                    </motion.div>
                  ))}
                </div>
              ) : marketData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "bitcoin", name: "Bitcoin (BTC)", shortName: "BTC" },
                    { key: "ethereum", name: "Ethereum (ETH)", shortName: "ETH" },
                    { key: "solana", name: "Solana (SOL)", shortName: "SOL" },
                    { key: "avalanche", name: "Avalanche (AVAX)", shortName: "AVAX" },
                    { key: "dogwifcoin", name: "Dogwifhat (WIF)", shortName: "WIF" },
                    { key: "popcat", name: "Popcat (POPCAT)", shortName: "POPCAT" },
                    { key: "pepe", name: "Pepe (PEPE)", shortName: "PEPE" },
                    { key: "uniswap", name: "Uniswap (UNI)", shortName: "UNI" },
                    { key: "ai16z", name: "ai16z (AI16Z)", shortName: "AI16Z" },
                  ].map((crypto, index) => {
                    const data = marketData[crypto.key as keyof MarketData] as any
                    if (!data) return null

                    return (
                      <motion.div
                        key={crypto.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-gradient-to-br from-slate-700/30 via-slate-800/30 to-slate-700/30 border border-slate-600/50 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-purple-500/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/80 text-sm font-medium">
                            <span className="hidden sm:inline">{crypto.name}</span>
                            <span className="sm:hidden">{crypto.shortName}</span>
                          </span>
                          <Badge
                            className={`${
                              data.change24h >= 0
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
                                : "bg-red-500/20 text-red-300 border-red-400/20"
                            }`}
                          >
                            {data.change24h >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {data.change24h >= 0 ? "+" : ""}
                            {data.change24h.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-xl font-bold text-white mb-2">
                          $
                          {crypto.key === "bitcoin"
                            ? data.price.toLocaleString()
                            : data.price.toFixed(crypto.key === "pepe" ? 6 : 4)}
                        </p>
                        <p className="text-xs text-white/60">
                          <span className="hidden sm:inline">24ч объем: </span>
                          {formatLargeNumber(data.volume24h)}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-8"
                >
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">Не удалось загрузить рыночные данные</p>
                  {marketError && <p className="text-red-400 text-sm">{marketError}</p>}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Улучшенный Статус Системы */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl shadow-purple-500/10"
        >
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="text-white flex items-center text-xl">
                <div className="p-2 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-lg border border-emerald-500/30 mr-3">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="hidden sm:inline">Статус Системы</span>
                <span className="sm:hidden">Система</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {dataSourcesStatus.map((source, index) => {
                  const Icon = source.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-700/40 via-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-xl backdrop-blur-sm shadow-lg transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10">
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />

                        <div className="flex items-center space-x-3 relative z-10">
                          <div className="p-2 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-lg border border-purple-500/30">
                            <Icon className={`w-5 h-5 ${source.color}`} />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{source.name}</p>
                            <p className="text-white/60 text-xs">
                              <span className="hidden sm:inline">Обновлено: </span>
                              {source.lastUpdate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 relative z-10">
                          <motion.div
                            animate={source.status === "connected" ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          >
                            {getStatusIcon(source.status)}
                          </motion.div>
                          <span className={`text-xs ${source.color} hidden sm:inline font-medium`}>
                            {getStatusText(source.status)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Ping информация */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-xl border border-emerald-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Ping к серверу</p>
                      <p className="text-white/60 text-sm">Время отклика системы</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap
                      className={`w-4 h-4 ${pingTime < 100 ? "text-green-400" : pingTime < 300 ? "text-yellow-400" : "text-red-400"}`}
                    />
                    <span
                      className={`font-medium text-sm ${pingTime < 100 ? "text-green-400" : pingTime < 300 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {pingTime}ms
                    </span>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
