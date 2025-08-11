"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { ImprovedDashboard } from "@/components/improved-dashboard"
import { UltraModernNavigation } from "@/components/ultra-modern-navigation"
import { CryptoJournal } from "@/components/crypto-journal"
import { FinancialGoals } from "@/components/financial-goals"
import { UserProfile } from "@/components/user-profile"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { GlobalPasswordGuard } from "@/components/global-password-guard"
import StatusUpdates from "@/components/status-updates"
import { getSupabaseClient } from "@/lib/supabase"
import { TradingStatistics } from "@/components/trading-statistics"
import { motion, AnimatePresence } from "framer-motion"
import { Providers } from "@/components/providers"
import { ErrorBoundary } from "@/components/error-boundary"
import { NewsComingSoon } from "@/components/news-coming-soon"

// Simple loading
function SimpleLoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Инициализация...")

  useEffect(() => {
    const steps = [
      { p: 25, t: "Подключение к серверу..." },
      { p: 50, t: "Загрузка пользовательских данных..." },
      { p: 75, t: "Синхронизация торговых данных..." },
      { p: 100, t: "Готово!" },
    ]
    let i = 0
    const it = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].p)
        setLoadingText(steps[i].t)
        i++
      } else clearInterval(it)
    }, 800)
    return () => clearInterval(it)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-pink-500/20 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-purple-600/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-pink-600/20 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            ODINNS
          </div>
          <h2 className="text-2xl font-bold text-white">Загрузка...</h2>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white font-medium">{loadingText}</p>
            <p className="text-white/60 text-sm">{progress}% завершено</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FullScreenWelcome({ user, onComplete }: { user: any; onComplete: () => void }) {
  const [showWelcome, setShowWelcome] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
      setTimeout(onComplete, 1000)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-xl"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, -180, -360] }}
              transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-xl"
            />
            <motion.div
              animate={{ scale: [1.1, 1, 1.1], rotate: [-360, -180, 0] }}
              transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute bottom-10 right-10 w-36 h-36 bg-gradient-to-r from-pink-600/30 to-purple-600/30 rounded-full blur-xl"
            />
          </div>

          <div className="relative z-10 text-center space-y-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="space-y-6"
            >
              <motion.div
                animate={{
                  textShadow: [
                    "0 0 20px rgba(168, 85, 247, 0.5)",
                    "0 0 40px rgba(236, 72, 153, 0.5)",
                    "0 0 20px rgba(168, 85, 247, 0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              >
                ODINNS
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <h1 className="text-5xl font-bold text-white">
                  Добро пожаловать,{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {user.username}
                  </span>
                  !
                </h1>
                <p className="text-2xl text-white/70">Платформа готова</p>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 2 }}
                className="flex justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-20 h-20 border-4 border-purple-400/30 border-t-purple-400 rounded-full"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.5 }}
                className="text-white/60 text-lg"
              >
                Переход на главную страницу...
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [currentView, setCurrentView] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [globalPasswordVerified, setGlobalPasswordVerified] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    const authData = localStorage.getItem("odinns_auth")
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed.user && parsed.timestamp) {
          const now = Date.now()
          const hoursDiff = (now - parsed.timestamp) / (1000 * 60 * 60)
          if (hoursDiff < 24) {
            setUser(parsed.user)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem("odinns_auth")
          }
        }
      } catch {
        localStorage.removeItem("odinns_auth")
      }
    }
    setIsLoading(false)
  }, [])

  const handleGlobalPasswordSuccess = () => {
    setGlobalPasswordVerified(true)
  }

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    setShowWelcomeScreen(true)
    localStorage.setItem(
      "odinns_auth",
      JSON.stringify({
        user: userData,
        timestamp: Date.now(),
      }),
    )
    console.log(`Добро пожаловать, ${userData.username}!`)
  }

  const handleWelcomeComplete = () => setShowWelcomeScreen(false)

  const handleLogout = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setUser(null)
      setIsAuthenticated(false)
      setCurrentView("dashboard")
      localStorage.removeItem("odinns_auth")
      setIsTransitioning(false)
      console.log("Вы вышли из системы")
    }, 500)
  }

  const handleViewChange = (view: string) => {
    if (view === currentView) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentView(view)
      setIsTransitioning(false)
    }, 200)
  }

  const renderCurrentView = () => {
    const viewComponent = (() => {
      switch (currentView) {
        case "dashboard":
          return <ImprovedDashboard user={user} />
        case "trading":
          return <CryptoJournal user={user} />
        case "statistics":
          return <TradingStatistics user={user} />
        case "goals":
          return <FinancialGoals user={user} />
        case "journal":
          return <CryptoJournal user={user} />
        case "activity":
          return <ActivityFeed />
        case "profile":
          return <UserProfile user={user} onUserUpdate={setUser} />
        case "status":
          return <StatusUpdates />
        case "news":
          return <NewsComingSoon />
        default:
          return <ImprovedDashboard user={user} />
      }
    })()

    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
      >
        {viewComponent}
      </div>
    )
  }

  if (isLoading) return <SimpleLoadingScreen />
  if (!globalPasswordVerified) return <GlobalPasswordGuard onSuccess={handleGlobalPasswordSuccess} />
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Providers>
          <LoginForm onLogin={handleLoginSuccess} />
        </Providers>
      </ErrorBoundary>
    )
  }
  if (showWelcomeScreen) return <FullScreenWelcome user={user} onComplete={handleWelcomeComplete} />

  return (
    <ErrorBoundary>
      <Providers>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 w-full">
          <UltraModernNavigation
            user={user}
            currentView={currentView}
            onViewChange={handleViewChange}
            onLogout={handleLogout}
            weatherData={weatherData}
          />
          <main className="lg:pl-0 pb-16 lg:pb-0 w-full">
            <div className="pt-0 lg:pt-0 w-full px-0">{renderCurrentView()}</div>
          </main>
        </div>
      </Providers>
    </ErrorBoundary>
  )
}
