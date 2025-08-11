"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { TrendingUp, DollarSign, BarChart3, Activity, Wallet, Target, Star, Zap, Shield, Globe } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { getUserBalance } from "@/lib/auth"
import { convertUSDToUAH, formatUAH, getUSDToUAHRate } from "@/lib/currency-converter"

interface WelcomeDashboardProps {
  user: any
}

export function WelcomeDashboard({ user }: WelcomeDashboardProps) {
  const [currentBalance, setCurrentBalance] = useState(0)
  const [usdToUahRate, setUsdToUahRate] = useState(41.5)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    winRate: 0,
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user?.id) {
      loadUserData()
      loadExchangeRate()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      // Load balance
      const balance = await getUserBalance(user.id)
      setCurrentBalance(balance)

      // Load trading stats
      const { data: trades } = await supabase
        .from("crypto_journal")
        .select("profit_loss, trade_type")
        .eq("user_id", user.id)
        .eq("trade_type", "trade")

      if (trades) {
        const totalTrades = trades.length
        const profitableTrades = trades.filter((t) => t.profit_loss > 0).length
        const totalProfit = trades.reduce((sum, t) => sum + t.profit_loss, 0)
        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0

        setStats({
          totalTrades,
          profitableTrades,
          totalProfit,
          winRate,
        })
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExchangeRate = async () => {
    try {
      const rate = await getUSDToUAHRate()
      setUsdToUahRate(rate)
    } catch (error) {
      console.error("Error loading exchange rate:", error)
    }
  }

  const features = [
    {
      icon: BarChart3,
      title: "Продвинутая Аналитика",
      description: "Детальный анализ ваших торговых операций",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "Безопасность",
      description: "Надежная защита ваших данных",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Zap,
      title: "Быстрая Работа",
      description: "Мгновенное обновление данных в реальном времени",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Globe,
      title: "Глобальные Рынки",
      description: "Доступ к мировым криптовалютным рынкам",
      color: "from-purple-500 to-pink-500",
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-4">
            <Avatar className="w-16 h-16 ring-4 ring-purple-500/30">
              <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Добро пожаловать, {user?.username}!
              </h1>
              <p className="text-white/60 text-lg mt-2">Готовы к успешной торговле</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-300">Текущий Баланс</p>
                  <p className={`text-2xl font-bold ${currentBalance >= 0 ? "text-emerald-100" : "text-red-100"}`}>
                    ${currentBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-emerald-300">{formatUAH(convertUSDToUAH(currentBalance, usdToUahRate))}</p>
                </div>
                <Wallet className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Всего Сделок</p>
                  <p className="text-2xl font-bold text-blue-100">{stats.totalTrades}</p>
                  <p className="text-xs text-blue-300">Торговых операций</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Винрейт</p>
                  <p className="text-2xl font-bold text-green-100">{stats.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-green-300">{stats.profitableTrades} прибыльных</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Общая Прибыль</p>
                  <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-green-100" : "text-red-100"}`}>
                    {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-300">За все время</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 h-full">
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-400" />
                Быстрые Действия
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12">
                <BarChart3 className="w-5 h-5 mr-2" />
                Добавить Сделку
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12">
                <Target className="w-5 h-5 mr-2" />
                Установить Цель
              </Button>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12">
                <Activity className="w-5 h-5 mr-2" />
                Посмотреть Статистику
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
