"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, EyeOff, AlertCircle, Timer } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface GlobalPasswordGuardProps {
  onSuccess: () => void
}

export function GlobalPasswordGuard({ onSuccess }: GlobalPasswordGuardProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)

  const MAX_ATTEMPTS = 3
  const BLOCK_TIME = 20 * 60 // 20 minutes in seconds

  useEffect(() => {
    const blockedUntil = localStorage.getItem("odinns_blocked_until")
    if (blockedUntil) {
      const blockedTime = Number.parseInt(blockedUntil)
      const now = Date.now()
      if (now < blockedTime) {
        setIsBlocked(true)
        setBlockTimeLeft(Math.ceil((blockedTime - now) / 1000))
      } else {
        localStorage.removeItem("odinns_blocked_until")
        localStorage.removeItem("odinns_attempts")
      }
    }

    const savedAttempts = localStorage.getItem("odinns_attempts")
    if (savedAttempts) {
      setAttempts(Number.parseInt(savedAttempts))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isBlocked && blockTimeLeft > 0) {
      interval = setInterval(() => {
        setBlockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBlocked(false)
            localStorage.removeItem("odinns_blocked_until")
            localStorage.removeItem("odinns_attempts")
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isBlocked, blockTimeLeft])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isBlocked) {
      toast.error(`Доступ заблокирован на ${Math.ceil(blockTimeLeft / 60)} минут`)
      return
    }

    if (!password.trim()) {
      toast.error("Введите пароль")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/verify-global-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem("odinns_global_verified", "true")
        localStorage.removeItem("odinns_attempts")
        localStorage.removeItem("odinns_blocked_until")

        toast.success("Доступ разрешен!")
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem("odinns_attempts", newAttempts.toString())

        if (newAttempts >= MAX_ATTEMPTS) {
          const blockedUntil = Date.now() + BLOCK_TIME * 1000
          localStorage.setItem("odinns_blocked_until", blockedUntil.toString())
          setIsBlocked(true)
          setBlockTimeLeft(BLOCK_TIME)
          toast.error(`Слишком много неверных попыток. Доступ заблокирован на 20 минут`)
        } else {
          toast.error(`Неверный пароль. Осталось попыток: ${MAX_ATTEMPTS - newAttempts}`)
        }

        setPassword("")
      }
    } catch (error) {
      console.error("Ошибка проверки пароля:", error)
      toast.error("Ошибка проверки пароля")
    }

    setIsLoading(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-40 right-32 w-24 h-24 bg-pink-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute bottom-32 left-32 w-40 h-40 bg-purple-600/20 rounded-full blur-xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-purple-900/90 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 rounded-3xl">
          <CardHeader className="space-y-6 text-center pb-8 pt-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                ODINNS
              </CardTitle>
              <p className="text-white/50 text-sm">Введите глобальный пароль для доступа</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            <AnimatePresence mode="wait">
              {isBlocked ? (
                <motion.div
                  key="blocked"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <div className="p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-red-400 mb-3">Доступ заблокирован</h3>
                    <p className="text-white/70 mb-4">Превышено количество попыток входа</p>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Timer className="w-6 h-6 text-red-400" />
                      <div className="text-3xl font-bold text-red-400 font-mono">{formatTime(blockTimeLeft)}</div>
                    </div>
                    <p className="text-red-300 text-sm">Попробуйте снова через {Math.ceil(blockTimeLeft / 60)} минут</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-purple-400" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите глобальный пароль"
                        className="pl-12 pr-12 h-14 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/50 rounded-2xl text-lg focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300"
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {attempts > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl"
                    >
                      <div className="flex items-center gap-3 text-yellow-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Внимание!</p>
                          <p className="text-sm text-yellow-300">Осталось попыток: {MAX_ATTEMPTS - attempts}</p>
                          <p className="text-xs text-yellow-400/70 mt-1">
                            При превышении лимита доступ будет заблокирован на 20 минут
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !password.trim()}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Проверка...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5" />
                        <span>Войти в систему</span>
                      </div>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="text-center">
              <p className="text-white/40 text-xs">Защищенный доступ к платформе ODINNS</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
