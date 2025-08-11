"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export function LoadingCard({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/20 animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6 text-blue-400 animate-spin" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-400`} />
    </div>
  )
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-6 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-white mt-4 font-medium">{message}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SkeletonJournalEntry() {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/20 animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex space-x-3">
            <div className="h-6 bg-white/20 rounded-full w-24"></div>
            <div className="h-6 bg-white/20 rounded-full w-24"></div>
          </div>
          <div className="h-8 bg-white/20 rounded w-32"></div>
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded w-full"></div>
            <div className="h-3 bg-white/10 rounded w-3/4"></div>
          </div>
          <div className="h-3 bg-white/10 rounded w-1/4"></div>
        </div>
      </CardContent>
    </Card>
  )
}

// Универсаль��ый компонент загрузки для всех страниц
export function UniversalLoading({
  title = "Загрузка...",
  subtitle = "Пожалуйста, подождите",
  showSpinner = true,
}: {
  title?: string
  subtitle?: string
  showSpinner?: boolean
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <motion.div
          className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl shadow-purple-500/10 p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center space-y-6">
            {showSpinner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 border-4 border-purple-500/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-pink-400 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {title}
              </h2>
              <p className="text-white/60 text-lg">{subtitle}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Компонент загрузки для панелей/карточек
export function PanelLoading({
  title = "Загрузка данных...",
  height = "h-64",
}: {
  title?: string
  height?: string
}) {
  return (
    <motion.div
      className={`bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl shadow-purple-500/10 ${height} flex items-center justify-center`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-4">
        <motion.div
          className="relative mx-auto w-12 h-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className="w-12 h-12 border-3 border-purple-500/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute top-0 left-0 w-12 h-12 border-3 border-transparent border-t-purple-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </motion.div>

        <motion.p
          className="text-white/70 text-lg font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {title}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Компонент загрузки для таблиц
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
            </div>
            <div className="w-20 h-6 bg-white/10 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
