"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase"
import { getUserBalance, getTradingStats, updateUserAvatar } from "@/lib/auth"
import { convertUSDToUAH, formatUAH, getUSDToUAHRate } from "@/lib/currency-converter"
import {
  Upload,
  Wallet,
  RefreshCw,
  Camera,
  TrendingUp,
  Edit3,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"
import { UniversalLoading } from "@/components/loading-states"
import { useToast } from "@/hooks/use-toast"

interface UserProfileProps {
  user: any
  onUserUpdate: (updatedUser: any) => void
  language?: string
}

function UserProfile({ user, onUserUpdate, language = "ru" }: UserProfileProps) {
  const supabase = getSupabaseClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()

  // Avatar states
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now())

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Username change states
  const [newUsername, setNewUsername] = useState("")
  const [isChangingUsername, setIsChangingUsername] = useState(false)
  const [showUsernameForm, setShowUsernameForm] = useState(false)

  // Trading data states
  const [tradingStats, setTradingStats] = useState({
    totalPnL: 0,
    todayPnL: 0,
    totalTrades: 0,
    winRate: 0,
    bestTrade: 0,
    worstTrade: 0,
  })
  const [currentBalance, setCurrentBalance] = useState(0)
  const [usdToUahRate, setUsdToUahRate] = useState(41.5)

  const [isLoading, setIsLoading] = useState(true)

  // Определяем мобильное устройство
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const apply = () => setIsMobile(mq.matches)

    // Throttle with requestAnimationFrame
    let scheduled = false
    const onResize = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        apply()
      })
    }

    apply()
    window.addEventListener("resize", onResize)
    // Also respond to prefers changes
    mq.addEventListener?.("change", apply)

    return () => {
      window.removeEventListener("resize", onResize)
      mq.removeEventListener?.("change", apply)
    }
  }, [])

  // Get current avatar URL
  const getCurrentAvatarUrl = useCallback(() => {
    if (user.avatar_url && user.avatar_url !== "null" && user.avatar_url !== "undefined") {
      return user.avatar_url
    }
    return ""
  }, [user.avatar_url])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Set avatar
        const currentAvatar = getCurrentAvatarUrl()
        setAvatarUrl(currentAvatar)

        await Promise.all([
          getTradingStats(user.id).then(setTradingStats).catch(console.error),
          getUserBalance(user.id).then(setCurrentBalance).catch(console.error),
          getUSDToUAHRate().then(setUsdToUahRate).catch(console.error),
        ])

        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error("Error loading profile data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user.id, getCurrentAvatarUrl])

  // Handle avatar upload
  const handleAvatarUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Ошибка", description: "Файл слишком большой. Максимум 5MB", variant: "destructive" })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({ title: "Ошибка", description: "Выберите изображение", variant: "destructive" })
        return
      }

      setIsUploading(true)

      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string
          await updateAvatarGlobally(dataUrl)
          setIsUploading(false)
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error("Upload error:", error)
        toast({ title: "Ошибка", description: "Ошибка загрузки", variant: "destructive" })
        setIsUploading(false)
      }
    },
    [user.id, toast],
  )

  // Global avatar update function
  const updateAvatarGlobally = useCallback(
    async (newAvatarUrl: string) => {
      try {
        const success = await updateUserAvatar(user.id, newAvatarUrl)
        if (!success) {
          toast({ title: "Ошибка", description: "Ошибка сохранения аватара", variant: "destructive" })
          return
        }

        // Update localStorage
        const authData = localStorage.getItem("odinns_auth")
        if (authData) {
          const parsed = JSON.parse(authData)
          parsed.user.avatar_url = newAvatarUrl
          localStorage.setItem("odinns_auth", JSON.stringify(parsed))
        }

        // Update states
        setAvatarUrl(newAvatarUrl)
        setAvatarTimestamp(Date.now())

        // Update parent component
        const updatedUser = { ...user, avatar_url: newAvatarUrl }
        onUserUpdate(updatedUser)

        // Global event
        window.dispatchEvent(
          new CustomEvent("avatarUpdated", {
            detail: { userId: user.id, avatarUrl: newAvatarUrl },
          }),
        )

        toast({ title: "Готово", description: "Аватар обновлен!", variant: "default" })
      } catch (error) {
        console.error("Error updating avatar:", error)
        toast({ title: "Ошибка", description: "Ошибка обновления аватара", variant: "destructive" })
      }
    },
    [user, onUserUpdate, toast],
  )

  // Global user update function
  const updateUserGlobally = useCallback(
    (updatedUser: any) => {
      // Update localStorage
      const authData = localStorage.getItem("odinns_auth")
      if (authData) {
        const parsed = JSON.parse(authData)
        parsed.user = updatedUser
        localStorage.setItem("odinns_auth", JSON.stringify(parsed))
      }

      // Update parent
      onUserUpdate(updatedUser)

      // Global event
      window.dispatchEvent(
        new CustomEvent("userUpdated", {
          detail: { user: updatedUser },
        }),
      )
    },
    [onUserUpdate],
  )

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" })
      return
    }

    if (newPassword.length < 3) {
      toast({ title: "Ошибка", description: "Минимум 3 символа", variant: "destructive" })
      return
    }

    setIsChangingPassword(true)

    try {
      const { data: userData } = await supabase.from("users").select("password_hash").eq("id", user.id).single()

      if (!userData || userData.password_hash !== currentPassword.trim()) {
        toast({ title: "Ошибка", description: "Неверный текущий пароль", variant: "destructive" })
        return
      }

      const { error } = await supabase
        .from("users")
        .update({
          password_hash: newPassword.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (!error) {
        toast({ title: "Пароль изменен 🔒", description: "Ваш аккаунт защищен", variant: "default" })
      }

      if (error) {
        toast({ title: "Ошибка", description: "Ошибка обновления пароля", variant: "destructive" })
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordForm(false)
    } catch (error) {
      console.error("Password change error:", error)
      toast({ title: "Ошибка", description: "Ошибка изменения пароля", variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }, [supabase, user.id, currentPassword, newPassword, confirmPassword, toast])

  // Handle username change
  const handleUsernameChange = useCallback(async () => {
    if (!newUsername.trim()) {
      toast({ title: "Ошибка", description: "Введите новый никнейм", variant: "destructive" })
      return
    }

    if (newUsername.trim().length < 3 || newUsername.trim().length > 20) {
      toast({ title: "Ошибка", description: "От 3 до 20 символов", variant: "destructive" })
      return
    }

    if (newUsername.trim() === user.username) {
      toast({ title: "Ошибка", description: "Никнейм не изменился", variant: "destructive" })
      return
    }

    setIsChangingUsername(true)

    try {
      // Check uniqueness
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", newUsername.trim())
        .single()

      if (existingUser) {
        toast({ title: "Ошибка", description: "Никнейм занят", variant: "destructive" })
        return
      }

      // Update username
      const { error } = await supabase
        .from("users")
        .update({
          username: newUsername.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (!error) {
        toast({ title: "Никнейм изменен ✨", description: newUsername.trim(), variant: "default" })
      }

      if (error) {
        toast({ title: "Ошибка", description: "Ошибка обновления", variant: "destructive" })
        return
      }

      const updatedUser = { ...user, username: newUsername.trim() }
      updateUserGlobally(updatedUser)

      setNewUsername("")
      setShowUsernameForm(false)
    } catch (error) {
      console.error("Username change error:", error)
      toast({ title: "Ошибка", description: "Ошибка изменения никнейма", variant: "destructive" })
    } finally {
      setIsChangingUsername(false)
    }
  }, [supabase, user, newUsername, updateUserGlobally, toast])

  if (isLoading) {
    return <UniversalLoading title="Загрузка профиля..." subtitle="Подготавливаем данные пользователя" />
  }

  return (
    <div
      className={`w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 ${isMobile ? "pb-20" : ""}`}
    >
      <div className={`w-full ${isMobile ? "p-3" : "p-4 md:p-6"}`}>
        {/* Mobile Header with Back Button */}
        {isMobile && (
          <div className="flex items-center mb-4 p-3 bg-slate-800/50 rounded-2xl backdrop-blur-xl border border-purple-500/30">
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-xl mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Профиль
            </h1>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="bg-gradient-to-r from-slate-800/50 via-purple-900/30 to-slate-800/50 rounded-3xl p-6 border border-purple-500/30 backdrop-blur-xl mb-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Профиль пользователя
              </h1>
              <p className="text-white/60">Управление аккаунтом и настройками</p>
            </div>
          </div>
        )}

        <div className="w-full space-y-4">
          {/* Main Profile Card - оптимизированная для мобильных */}
          <div
            className={`bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl rounded-3xl ${isMobile ? "p-4" : "p-6"} border border-purple-500/30 shadow-2xl shadow-purple-500/10`}
          >
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-purple-400" />
              <h2 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-white`}>Основная информация</h2>
            </div>

            {/* Avatar Section - компактная для мобильных */}
            <div
              className={`flex ${isMobile ? "flex-row items-center" : "flex-col items-center"} ${isMobile ? "space-x-4" : "space-y-4"} ${isMobile ? "mb-4" : "mb-8"}`}
            >
              <div className="relative group">
                <Avatar className={`${isMobile ? "w-16 h-16" : "w-24 h-24"} ring-4 ring-purple-500/30`}>
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={user.username} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-bold">
                    {user.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center backdrop-blur-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className={`${isMobile ? "w-4 h-4" : "w-6 h-6"} text-white`} />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className={`${isMobile ? "flex-1" : "text-center"} space-y-2`}>
                <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-white`}>{user.username}</h2>
                <div className="flex items-center gap-2 text-purple-300">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Регистрация: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>

                {/* Mobile buttons */}
                {isMobile && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      size="sm"
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg text-xs"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      {isUploading ? "..." : "Фото"}
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      size="sm"
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Обновить
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop buttons */}
            {!isMobile && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Загрузка..." : "Сменить аватар"}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обновить
                </Button>
              </div>
            )}
          </div>

          {/* Trading Statistics Card - компактная для мобильных */}
          <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-green-900/20 backdrop-blur-xl border border-green-500/30 shadow-2xl shadow-green-500/10">
            <CardHeader className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitle className={`text-white flex items-center ${isMobile ? "text-lg" : ""}`}>
                <TrendingUp className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-green-400 mr-3`} />
                Торговая статистика
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-4 pt-2" : ""}>
              <div
                className={`grid ${isMobile ? "grid-cols-2 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}`}
              >
                <div
                  className={`bg-slate-700/30 backdrop-blur-sm rounded-2xl ${isMobile ? "p-3" : "p-4"} border border-slate-600/30`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>Текущий баланс</p>
                      <p className={`text-white ${isMobile ? "text-lg" : "text-xl"} font-bold`}>
                        ${currentBalance.toFixed(2)}
                      </p>
                      <p className={`text-green-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                        {formatUAH(convertUSDToUAH(currentBalance, usdToUahRate))}
                      </p>
                    </div>
                    <Wallet className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} text-green-400`} />
                  </div>
                </div>

                <div
                  className={`bg-slate-700/30 backdrop-blur-sm rounded-2xl ${isMobile ? "p-3" : "p-4"} border border-slate-600/30`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>Общий P&L</p>
                      <p
                        className={`${isMobile ? "text-lg" : "text-xl"} font-bold ${
                          tradingStats.totalPnL >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        ${tradingStats.totalPnL.toFixed(2)}
                      </p>
                      <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                        {formatUAH(convertUSDToUAH(tradingStats.totalPnL, usdToUahRate))}
                      </p>
                    </div>
                    <TrendingUp className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} text-blue-400`} />
                  </div>
                </div>

                <div
                  className={`bg-slate-700/30 backdrop-blur-sm rounded-2xl ${isMobile ? "p-3" : "p-4"} border border-slate-600/30 ${isMobile ? "col-span-2" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>Сегодня P&L</p>
                      <p
                        className={`${isMobile ? "text-lg" : "text-xl"} font-bold ${
                          tradingStats.todayPnL >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        ${tradingStats.todayPnL.toFixed(2)}
                      </p>
                      <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                        {formatUAH(convertUSDToUAH(tradingStats.todayPnL, usdToUahRate))}
                      </p>
                    </div>
                    <Calendar className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} text-purple-400`} />
                  </div>
                </div>

                {!isMobile && (
                  <>
                    <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Всего сделок</p>
                          <p className="text-white text-xl font-bold">{tradingStats.totalTrades}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-cyan-400" />
                      </div>
                    </div>

                    <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Винрейт</p>
                          <p className="text-white text-xl font-bold">{tradingStats.winRate.toFixed(1)}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-yellow-400" />
                      </div>
                    </div>

                    <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Лучшая сделка</p>
                          <p className="text-green-400 text-xl font-bold">${tradingStats.bestTrade.toFixed(2)}</p>
                          <p className="text-slate-400 text-sm">
                            {formatUAH(convertUSDToUAH(tradingStats.bestTrade, usdToUahRate))}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Settings Card */}
          <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-red-900/20 backdrop-blur-xl border border-red-500/30 shadow-2xl shadow-red-500/10">
            <CardHeader className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitle className={`text-white flex items-center ${isMobile ? "text-lg" : ""}`}>
                <Shield className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-red-400 mr-3`} />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-4 ${isMobile ? "p-4 pt-2" : "space-y-6"}`}>
              {/* Username Change */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-white font-semibold ${isMobile ? "text-sm" : ""}`}>Изменить никнейм</h3>
                    <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>Текущий: {user.username}</p>
                  </div>
                  <Button
                    onClick={() => setShowUsernameForm(!showUsernameForm)}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Изменить
                  </Button>
                </div>

                {showUsernameForm && (
                  <div
                    className={`space-y-3 ${isMobile ? "p-3" : "p-4"} bg-slate-700/30 rounded-2xl border border-slate-600/30`}
                  >
                    <Input
                      type="text"
                      placeholder="Новый никнейм"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className={`bg-slate-600/30 border-slate-500/50 text-white rounded-lg ${isMobile ? "text-sm" : ""}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUsernameChange}
                        disabled={isChangingUsername}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        {isChangingUsername && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        )}
                        {isChangingUsername ? "Изменение..." : "Изменить никнейм"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowUsernameForm(false)
                          setNewUsername("")
                        }}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Change */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-white font-semibold ${isMobile ? "text-sm" : ""}`}>Изменить пароль</h3>
                    <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                      Обновите пароль для безопасности
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Изменить
                  </Button>
                </div>

                {showPasswordForm && (
                  <div
                    className={`space-y-3 ${isMobile ? "p-3" : "p-4"} bg-slate-700/30 rounded-2xl border border-slate-600/30`}
                  >
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Текущий пароль"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`bg-slate-600/30 border-slate-500/50 text-white rounded-lg pr-10 ${isMobile ? "text-sm" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Новый пароль"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`bg-slate-600/30 border-slate-500/50 text-white rounded-lg pr-10 ${isMobile ? "text-sm" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <Input
                      type="password"
                      placeholder="Подтвердите новый пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`bg-slate-600/30 border-slate-500/50 text-white rounded-lg ${isMobile ? "text-sm" : ""}`}
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={handlePasswordChange}
                        disabled={isChangingPassword}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      >
                        {isChangingPassword && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        )}
                        {isChangingPassword ? "Изменение..." : "Изменить пароль"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowPasswordForm(false)
                          setCurrentPassword("")
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export { UserProfile }
export default UserProfile
