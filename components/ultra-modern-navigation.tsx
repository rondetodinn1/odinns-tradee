"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, BookOpen, Target, User, LogOut, Menu, X, ChevronDown, TrendingUp, Newspaper } from 'lucide-react'
import { motion } from "framer-motion"

interface NavigationProps {
  user: any
  currentView: string
  onViewChange: (view: string) => void
  onLogout: () => void
  weatherData?: any
}

const navigationItems = [
  { id: "dashboard", label: "Панель", icon: BarChart3, color: "from-blue-500 to-cyan-500", shortLabel: "Панель" },
  { id: "journal", label: "Журнал", icon: BookOpen, color: "from-purple-500 to-pink-500", shortLabel: "Журнал" },
  {
    id: "statistics",
    label: "Статистика",
    icon: TrendingUp,
    color: "from-orange-500 to-red-500",
    shortLabel: "Статистика",
  },
  { id: "goals", label: "Цели", icon: Target, color: "from-indigo-500 to-purple-500", shortLabel: "Цели" },
  { id: "news", label: "Новости", icon: Newspaper, color: "from-teal-500 to-emerald-500", shortLabel: "Новости" },
]

export function UltraModernNavigation({ user, currentView, onViewChange, onLogout, weatherData }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now())
  const [currentUser, setCurrentUser] = useState(user)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => setCurrentUser(user), [user])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".user-menu-container") && !target.closest(".mobile-menu-container")) {
        setIsUserMenuOpen(false)
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const handleViewChangeLocal = (view: string) => {
    onViewChange(view)
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  const handleLogoutLocal = () => {
    onLogout()
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  const formatDate = (date: Date) =>
    date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })

  const getAvatarUrl = () =>
    currentUser.avatar_url && currentUser.avatar_url !== "null" && currentUser.avatar_url !== "undefined"
      ? currentUser.avatar_url
      : ""

  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      if ((event as any).detail.userId === currentUser.id) {
        setAvatarTimestamp(Date.now())
        setCurrentUser((prev: any) => ({ ...prev, avatar_url: (event as any).detail.avatarUrl }))
      }
    }
    const handleUserUpdate = (event: CustomEvent) => {
      setCurrentUser((event as any).detail.user)
      setAvatarTimestamp(Date.now())
    }
    window.addEventListener("avatarUpdated", handleAvatarUpdate as EventListener)
    window.addEventListener("userUpdated", handleUserUpdate as EventListener)
    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate as EventListener)
      window.removeEventListener("userUpdated", handleUserUpdate as EventListener)
    }
  }, [currentUser.id])

  const currentAvatarUrl = getAvatarUrl()

  const handleMobileProfileClick = () => {
    if (isMobile) {
      handleViewChangeLocal("profile")
    } else {
      setIsUserMenuOpen(!isUserMenuOpen)
    }
  }

  return (
    <>
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/95 border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: brand + time */}
            <div className="flex items-center space-x-6">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ODINNS
              </div>
              <div className="hidden md:flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="px-4 py-2 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-2xl rounded-xl border border-white/20 shadow-xl"
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      key={formatTime(currentTime)}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white font-mono text-lg font-bold tracking-wide leading-none"
                    >
                      {formatTime(currentTime)}
                    </motion.div>
                    <div className="w-px h-5 bg-gradient-to-b from-purple-400/50 to-pink-400/50" />
                    <span className="text-white/80 text-sm font-medium leading-none">{formatDate(currentTime)}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Center: desktop nav */}
            <div className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon as any
                const isActive = currentView === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleViewChangeLocal(item.id)}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 h-12 text-base ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-purple-500/20`
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                )
              })}
            </div>

            {/* Right: user + mobile menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block relative user-menu-container">
                <button
                  onClick={handleMobileProfileClick}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 h-12"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-white/20" key={`nav-avatar-${currentUser.id}-${avatarTimestamp}`}>
                    <AvatarImage src={currentAvatarUrl || "/placeholder.svg?height=32&width=32&query=avatar"} alt={currentUser?.username} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium">
                      {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white leading-none">{currentUser?.username || "User"}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-3 w-72 bg-gradient-to-br from-slate-800/98 via-slate-900/98 to-purple-900/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-500/20 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 ring-2 ring-purple-400/30">
                          <AvatarImage src={currentAvatarUrl || "/placeholder.svg?height=48&width=48&query=avatar"} alt={currentUser?.username} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg">
                            {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-lg truncate">{currentUser?.username || "User"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => handleViewChangeLocal("profile")}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-colors duration-200 group"
                      >
                        <div className="p-2 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-200">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Профиль</p>
                          <p className="text-sm text-white/60">Настройки аккаунта</p>
                        </div>
                      </button>

                      <div className="border-t border-white/10 my-2" />

                      <button
                        onClick={handleLogoutLocal}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 transition-colors duration-200 group"
                      >
                        <div className="p-2 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
                          <LogOut className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Выйти</p>
                          <p className="text-sm text-red-400/60">Завершить сеанс</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Mobile avatar */}
              <div className="sm:hidden">
                <button
                  onClick={handleMobileProfileClick}
                  className="p-1 rounded-full hover:bg-white/10 transition-all duration-300"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-white/20" key={`mobile-avatar-${currentUser.id}-${avatarTimestamp}`}>
                    <AvatarImage src={currentAvatarUrl || "/placeholder.svg?height=32&width=32&query=avatar"} alt={currentUser?.username} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium">
                      {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-white hover:bg-white/10 rounded-xl h-9 w-9"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-x-0 top-16 bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-purple-900/98 backdrop-blur-xl border-b border-white/10 shadow-2xl mobile-menu-container animate-in slide-in-from-top duration-300">
            <div className="container mx-auto px-4 py-6">
              {/* Mobile user */}
              <div className="flex items-center space-x-4 p-4 mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10">
                <Avatar className="h-12 w-12 ring-2 ring-white/20">
                  <AvatarImage src={currentAvatarUrl || "/placeholder.svg?height=48&width=48&query=avatar"} alt={currentUser?.username} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                    {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">{currentUser?.username || "User"}</p>
                </div>
              </div>

              {/* Mobile nav items */}
              <div className="space-y-3 mb-6">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon as any
                  const isActive = currentView === item.id
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.25 }}
                      onClick={() => handleViewChangeLocal(item.id)}
                      className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-[1.02]`
                          : "text-white hover:bg-white/10 active:scale-[0.98]"
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${isActive ? "bg-white/20" : "bg-white/10"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{item.label}</p>
                        <p className="text-sm opacity-80">
                          {item.id === "dashboard" && "Обзор данных"}
                          {item.id === "journal" && "Финансовые операции"}
                          {item.id === "statistics" && "Анализ данных"}
                          {item.id === "goals" && "Финансовые цели"}
                          {item.id === "news" && "Новости — скоро"}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Mobile actions */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleViewChangeLocal("profile")}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 ${
                    currentView === "profile"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${currentView === "profile" ? "bg-white/20" : "bg-blue-500/20"}`}>
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Профиль</p>
                    <p className="text-xs text-white/60">Настройки аккаунта</p>
                  </div>
                </button>

                <button
                  onClick={handleLogoutLocal}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/20 transition-all duration-300"
                >
                  <div className="p-2 rounded-xl bg-red-500/20">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Выйти</p>
                    <p className="text-xs text-red-400/60">Завершить сеанс</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom mobile bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-slate-900/98 to-slate-800/98 backdrop-blur-xl border-t border-white/10 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around px-1 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon as any
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleViewChangeLocal(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 min-w-0 flex-1 touch-manipulation ${
                  isActive ? "text-white" : "text-white/60 hover:text-white active:scale-95"
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? `bg-gradient-to-r ${item.color}` : "bg-white/10"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium truncate max-w-full">{item.shortLabel}</span>
                {isActive && <div className="w-1 h-1 bg-white rounded-full"></div>}
              </button>
            )
          })}

          <button
            onClick={() => handleViewChangeLocal("profile")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 min-w-0 flex-1 touch-manipulation ${
              currentView === "profile" ? "text-white" : "text-white/60 hover:text-white active:scale-95"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${currentView === "profile" ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-white/10"}`}
            >
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium truncate">Профиль</span>
            {currentView === "profile" && <div className="w-1 h-1 bg-white rounded-full"></div>}
          </button>
        </div>
      </div>

      <div className="lg:hidden h-16"></div>
    </>
  )
}
