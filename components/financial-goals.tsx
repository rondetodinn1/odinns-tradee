"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getSupabaseClient } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Plus, Edit, Trash2, Check, X, Calendar, DollarSign, TrendingUp, Users, Star, Zap, Flame, RotateCcw, ImageIcon as ImageIconLucide, Upload, FileImage, Loader2, Eye } from 'lucide-react'
import { UniversalLoading } from "@/components/loading-states"

interface FinancialGoal {
  id: string
  created_by: string
  created_by_username: string
  title: string
  description?: string
  target_amount: number
  current_amount: number
  target_date: string
  created_at: string
  updated_at: string
  status: "active" | "completed" | "expired"
  category: string
  priority: "low" | "medium" | "high"
  balance_mode: "current" | "zero"
  image_url?: string | null
  image_description?: string | null
}

interface GoalWithUser extends FinancialGoal {
  user_avatar?: string | null
}

export function FinancialGoals({ user }: { user: any }) {
  const supabase = getSupabaseClient()
  const [goals, setGoals] = useState<GoalWithUser[]>([])
  const [friendsGoals, setFriendsGoals] = useState<GoalWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"my" | "friends">("my")
  const [userBalance, setUserBalance] = useState(0)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  // Details dialog
  const [detailsGoal, setDetailsGoal] = useState<GoalWithUser | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    target_date: "",
    category: "trading",
    priority: "medium" as "low" | "medium" | "high",
    balance_mode: "current" as "current" | "zero",
    image_description: "",
  })

  useEffect(() => {
    if (user?.id) {
      loadAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadAllData = async () => {
    try {
      setIsLoading(true)

      // Compute current balance from journal
      const { data: journalData } = await supabase.from("crypto_journal").select("profit_loss").eq("user_id", user.id)
      let currentBalance = 0
      if (journalData && journalData.length > 0) {
        currentBalance = journalData.reduce(
          (total: number, entry: any) => total + (Number.parseFloat(entry.profit_loss) || 0),
          0,
        )
      }
      setUserBalance(currentBalance)

      // Load user's goals
      const { data: goalsData } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      const updatedGoals = await Promise.all(
        (goalsData || []).map(async (goal: any) => {
          const balanceMode = goal.balance_mode || "current"
          const newCurrentAmount =
            balanceMode === "zero" ? goal.current_amount || 0 : Math.max(0, Math.min(currentBalance, goal.target_amount))
          const newStatus: "active" | "completed" = newCurrentAmount >= goal.target_amount ? "completed" : "active"

          if (goal.current_amount !== newCurrentAmount || goal.status !== newStatus) {
            try {
              await supabase
                .from("financial_goals")
                .update({ current_amount: newCurrentAmount, status: newStatus })
                .eq("id", goal.id)
            } catch {}
          }

          return {
            ...goal,
            current_amount: newCurrentAmount,
            status: newStatus,
            balance_mode: balanceMode,
            user_avatar: user.avatar_url,
          } as GoalWithUser
        }),
      )
      setGoals(updatedGoals)

      await fetchFriendsGoals()
    } catch (e) {
      console.error("Load goals error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFriendsGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .neq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error

      const userIds = [...new Set((data || []).map((g: any) => g.created_by))]
      const { data: usersData } = await supabase.from("users").select("id, avatar_url").in("id", userIds)

      const goalsWithAvatars = (data || []).map((goal: any) => {
        const userAvatar = usersData?.find((u: any) => u.id === goal.created_by)?.avatar_url
        return {
          ...goal,
          user_avatar: userAvatar,
          balance_mode: goal.balance_mode || "current",
        } as GoalWithUser
      })

      setFriendsGoals(goalsWithAvatars)
    } catch (e) {
      console.error("Friends goals load error:", e)
    }
  }

  // Helpers
  const pathFromPublicUrl = (url: string) => {
    const marker = "/public/avatars/"
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.slice(idx + marker.length)
  }

  const deleteGoalImage = async (goalId: string, imageUrl: string | null | undefined) => {
    if (!imageUrl) return
    try {
      setDeletingImageId(goalId)
      const path = pathFromPublicUrl(imageUrl)
      if (path) {
        const { error: rm } = await supabase.storage.from("avatars").remove([path])
        if (rm) console.warn("Storage remove error:", rm.message)
      }
      const { error: upd } = await supabase
        .from("financial_goals")
        .update({ image_url: null, image_description: null })
        .eq("id", goalId)
      if (upd) console.error("DB update error:", upd.message)

      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, image_url: null, image_description: null } : g)))
      if (editingGoal === goalId) {
        setImagePreview(null)
        setSelectedFile(null)
        setFormData((f) => ({ ...f, image_description: "" }))
      }
    } catch (e) {
      console.error("Delete goal image error:", e)
    } finally {
      setDeletingImageId(null)
    }
  }

  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      setIsUploading(true)
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = `goal_${user.id}_${Date.now()}.${fileExt}`
      const filePath = `goals/${fileName}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })
      if (uploadError) throw new Error(uploadError.message)
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      if (!urlData?.publicUrl) throw new Error("no public url")
      return urlData.publicUrl
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) return console.error("Файл слишком большой")
      if (!file.type.startsWith("image/")) return console.error("Нужно изображение")
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.size > 10 * 1024 * 1024) return console.error("Файл слишком большой")
      if (!file.type.startsWith("image/")) return console.error("Нужно изображение")
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.target_amount || !formData.target_date) {
      console.error("Заполните все обязательные поля")
      return
    }

    try {
      const targetAmount = Number.parseFloat(formData.target_amount)
      const currentAmount =
        formData.balance_mode === "current" ? Math.max(0, Math.min(userBalance, targetAmount)) : 0
      let imageUrl = ""
      if (selectedFile) {
        imageUrl = await uploadImageToStorage(selectedFile)
      }

      const goalData: any = {
        created_by: user.id,
        created_by_username: String(user.username || "").substring(0, 50),
        title: formData.title.substring(0, 100),
        description: formData.description ? formData.description.substring(0, 200) : null,
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: formData.target_date,
        category: formData.category,
        priority: formData.priority,
        status: currentAmount >= targetAmount ? "completed" : ("active" as const),
        balance_mode: formData.balance_mode,
        image_description: formData.image_description ? formData.image_description.substring(0, 100) : null,
      }
      if (imageUrl) goalData.image_url = imageUrl

      if (editingGoal) {
        const { error } = await supabase.from("financial_goals").update(goalData).eq("id", editingGoal)
        if (error) console.error(error)
      } else {
        const { error } = await supabase.from("financial_goals").insert([goalData])
        if (error) console.error(error)
      }

      resetForm()
      loadAllData()
    } catch (error) {
      console.error("Ошибка сохранения цели:", error)
    }
  }

  const handleEdit = (goal: FinancialGoal) => {
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date.split("T")[0],
      category: goal.category,
      priority: goal.priority,
      balance_mode: goal.balance_mode || "current",
      image_description: goal.image_description || "",
    })
    setEditingGoal(goal.id)
    setShowAddForm(true)
    setSelectedFile(null)
    setImagePreview(goal.image_url || null)
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm("Удалить эту цель?")) return
    try {
      const goal = goals.find((g) => g.id === goalId)
      if (goal?.image_url) {
        await deleteGoalImage(goalId, goal.image_url)
      }
      const { error } = await supabase.from("financial_goals").delete().eq("id", goalId)
      if (error) console.error(error)
      loadAllData()
    } catch (e) {
      console.error("Ошибка удаления цели:", e)
    }
  }

  const handleToggleComplete = async (goal: FinancialGoal) => {
    try {
      const newStatus = goal.status === "completed" ? "active" : "completed"
      let newCurrentAmount = goal.current_amount
      if (newStatus === "completed") newCurrentAmount = goal.target_amount
      else if (goal.balance_mode === "current")
        newCurrentAmount = Math.max(0, Math.min(userBalance, goal.target_amount))

      const { error } = await supabase
        .from("financial_goals")
        .update({ status: newStatus, current_amount: newCurrentAmount })
        .eq("id", goal.id)
      if (error) console.error(error)
      loadAllData()
    } catch (e) {
      console.error("Ошибка обновления цели:", e)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_amount: "",
      target_date: "",
      category: "trading",
      priority: "medium",
      balance_mode: "current",
      image_description: "",
    })
    setSelectedFile(null)
    setImagePreview(null)
    setShowAddForm(false)
    setEditingGoal(null)
  }

  // UI helpers
  const getProgressPercentage = (current: number, target: number) => Math.min((current / target) * 100, 100)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-400/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30"
      case "low":
        return "bg-green-500/20 text-green-300 border-green-400/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "trading":
        return <TrendingUp className="w-4 h-4" />
      case "savings":
        return <DollarSign className="w-4 h-4" />
      case "investment":
        return <Target className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getPriorityLabel = (priority: string) =>
    priority === "high" ? "Высокий" : priority === "medium" ? "Средний" : "Низкий"
  const getCategoryLabel = (category: string) =>
    category === "trading"
      ? "Трейдинг"
      : category === "savings"
      ? "Накопления"
      : category === "investment"
      ? "Инвестиции"
      : "Другое"

  const isEditingExistingPhoto = useMemo(
    () => Boolean(editingGoal && imagePreview && imagePreview.startsWith("http")),
    [editingGoal, imagePreview],
  )

  const onRemoveImageClick = async () => {
    if (selectedFile) {
      setSelectedFile(null)
      setImagePreview(null)
      setFormData((f) => ({ ...f, image_description: "" }))
      return
    }
    if (editingGoal && isEditingExistingPhoto && imagePreview) {
      const ok = confirm("Удалить фото из цели?")
      if (!ok) return
      await deleteGoalImage(editingGoal, imagePreview)
    } else {
      setImagePreview(null)
    }
  }

  const onCardClick = useCallback((goal: GoalWithUser) => {
    setDetailsGoal(goal)
  }, [])

  if (isLoading) {
    return <UniversalLoading title="Загрузка целей..." subtitle="Подготавливаем финансовые данные" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 px-4 sm:px-6 py-6">
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-slate-800/60 via-purple-900/35 to-pink-900/35 rounded-3xl p-6 sm:p-8 border border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-purple-500/25 to-pink-500/25 rounded-full blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl" />
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-4 bg-gradient-to-br from-purple-500/25 via-pink-500/25 to-cyan-500/25 rounded-2xl border border-purple-500/40 shadow-lg"
                  whileHover={{ scale: 1.03, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Target className="w-10 h-10 text-purple-300" />
                </motion.div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                    Финансовые Цели
                  </h2>
                  <p className="text-white/70 text-base md:text-lg mt-1">Ставьте цели, отслеживайте прогресс</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500/15 to-green-500/15 rounded-xl border border-emerald-500/30">
                  <DollarSign className="w-5 h-5 text-emerald-300" />
                  <span className="text-white/80 text-sm font-medium">Текущий баланс:</span>
                  <span className={`font-bold text-lg ${userBalance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    ${userBalance.toFixed(2)}
                  </span>
                </div>

                <motion.button
                  onClick={loadAllData}
                  className="p-2 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-xl border border-blue-500/30 hover:from-blue-500/25 hover:to-cyan-500/25 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-5 h-5 text-blue-300" />
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-1 border border-slate-600/40 backdrop-blur-sm">
                <Button
                  onClick={() => setViewMode("my")}
                  className={`transition-all duration-300 rounded-xl px-5 py-3 ${
                    viewMode === "my"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-transparent text-white/65 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Мои Цели
                </Button>
                <Button
                  onClick={() => setViewMode("friends")}
                  className={`transition-all duration-300 rounded-xl px-5 py-3 ${
                    viewMode === "friends"
                      ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/25"
                      : "bg-transparent text-white/65 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Цели Друзей
                </Button>
              </div>

              {viewMode === "my" && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 border border-fuchsia-500/40 rounded-2xl transition-all duration-300 text-white shadow-lg shadow-fuchsia-500/25 px-6 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2 text-white" />
                    <span className="hidden sm:inline text-white font-medium">Добавить Цель</span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && viewMode === "my" && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-purple-900/25 backdrop-blur-xl border border-purple-500/35 rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden"
            >
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader className="p-6 sm:p-8 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                  <CardTitle className="text-white flex items-center gap-4 text-xl sm:text-2xl">
                    <motion.div className="p-3 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl border border-purple-500/30">
                      <Target className="w-8 h-8 text-purple-300" />
                    </motion.div>
                    <div>
                      <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                        {editingGoal ? "Редактировать цель" : "Создать новую цель"}
                      </span>
                      <p className="text-xs sm:text-sm text-white/65 font-normal mt-1">
                        {editingGoal ? "Обновите параметры вашей цели" : "Определите свою финансовую цель"}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="text-white font-medium text-lg flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-300" />
                          Название цели *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Например: Накопить на новый компьютер"
                          className="bg-slate-700/30 border-slate-600/50 text-white placeholder:text-white/50 focus:border-purple-400 rounded-2xl backdrop-blur-sm h-14 text-lg"
                          required
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="target_amount" className="text-white font-medium text-lg flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-300" />
                          Целевая сумма ($) *
                        </Label>
                        <Input
                          id="target_amount"
                          type="number"
                          step="0.01"
                          value={formData.target_amount}
                          onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                          placeholder="1000.00"
                          className="bg-slate-700/30 border-slate-600/50 text-white placeholder:text-white/50 focus:border-purple-400 rounded-2xl backdrop-blur-sm h-14 text-lg"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="target_date" className="text-white font-medium text-lg flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-300" />
                          Дата достижения *
                        </Label>
                        <Input
                          id="target_date"
                          type="date"
                          value={formData.target_date}
                          onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                          className="bg-slate-700/30 border-slate-600/50 text-white placeholder:text-white/50 focus:border-purple-400 rounded-2xl backdrop-blur-sm h-14 text-lg"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="category" className="text-white font-medium text-lg flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-300" />
                          Категория
                        </Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger className="bg-slate-700/30 border-slate-600/50 text-white rounded-2xl h-14 text-lg">
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 rounded-2xl">
                            <SelectItem value="trading" className="text-white hover:bg-slate-700 rounded-xl">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-300" />
                                Трейдинг
                              </div>
                            </SelectItem>
                            <SelectItem value="savings" className="text-white hover:bg-slate-700 rounded-xl">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-300" />
                                Накопления
                              </div>
                            </SelectItem>
                            <SelectItem value="investment" className="text-white hover:bg-slate-700 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-300" />
                                Инвестиции
                              </div>
                            </SelectItem>
                            <SelectItem value="other" className="text-white hover:bg-slate-700 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-300" />
                                Другое
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Balance Mode */}
                    <div className="space-y-4">
                      <Label htmlFor="balance_mode" className="text-white font-medium text-lg flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-cyan-300" />
                        Режим отслеживания баланса
                      </Label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                            formData.balance_mode === "current"
                              ? "border-green-400/50 bg-emerald-500/10"
                              : "border-slate-600/50 bg-slate-700/30 hover:border-green-400/30"
                          }`}
                          onClick={() => setFormData({ ...formData, balance_mode: "current" })}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-6 h-6 text-emerald-300" />
                            <span className="text-white font-semibold text-lg">Текущий баланс</span>
                          </div>
                          <p className="text-white/70 text-sm">Цель учитывает весь ваш текущий торговый баланс</p>
                        </div>

                        <div
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                            formData.balance_mode === "zero"
                              ? "border-blue-400/50 bg-blue-500/10"
                              : "border-slate-600/50 bg-slate-700/30 hover:border-blue-400/30"
                          }`}
                          onClick={() => setFormData({ ...formData, balance_mode: "zero" })}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <RotateCcw className="w-6 h-6 text-blue-300" />
                            <span className="text-white font-semibold text-lg">С нуля</span>
                          </div>
                          <p className="text-white/70 text-sm">Цель начинается с 0, учитывает только новые операции</p>
                        </div>
                      </div>
                    </div>

                    {/* Image upload */}
                    <div className="space-y-4">
                      <Label htmlFor="image" className="text-white font-medium text-lg flex items-center gap-2">
                        <ImageIconLucide className="w-4 h-4 text-purple-300" />
                        Изображение цели (опционально)
                      </Label>

                      {imagePreview && (
                        <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 group">
                          <img
                            src={imagePreview || "/placeholder.svg?height=256&width=512&query=goal%20image%20preview"}
                            alt="Превью цели"
                            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center justify-between">
                            <span className="text-white/90 text-sm line-clamp-1">
                              {formData.image_description || "Без описания"}
                            </span>
                            <div className="flex items-center gap-2">
                              {imagePreview.startsWith("http") && (
                                <Button
                                  type="button"
                                  onClick={() => setSelectedImagePreview(imagePreview)}
                                  className="bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg"
                                  title="Открыть изображение"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                onClick={onRemoveImageClick}
                                className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 rounded-lg"
                                disabled={deletingImageId !== null}
                                title={imagePreview.startsWith("http") ? "Удалить фото из цели" : "Убрать превью"}
                              >
                                {deletingImageId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                          dragActive ? "border-purple-400 bg-purple-500/10" : "border-white/20 hover:border-purple-400/50 hover:bg-white/5"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />

                        <div className="text-center">
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-4">
                              <FileImage className="w-10 h-10 text-green-300" />
                              <div>
                                <p className="text-green-300 font-medium text-lg">{selectedFile.name}</p>
                                <p className="text-white/60 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="w-12 h-12 text-white/40 mx-auto" />
                              <div>
                                <p className="text-white/75 text-lg">Перетащите изображение сюда или</p>
                                <p className="text-purple-300 font-medium text-lg">нажмите для выбора</p>
                              </div>
                              <p className="text-white/50 text-sm">PNG, JPG до 10MB</p>
                            </div>
                          )}

                          {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                              <div className="flex items-center gap-3 text-white">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-lg">Загружаем изображение...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {(selectedFile || imagePreview) && (
                        <div className="space-y-3">
                          <Label htmlFor="image_description" className="text-white font-medium text-lg">
                            Описание изображения
                          </Label>
                          <Input
                            id="image_description"
                            value={formData.image_description}
                            onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
                            placeholder="Краткое описание изображения..."
                            className="bg-slate-700/30 border-slate-600/50 text-white placeholder:text-white/50 focus:border-purple-400 rounded-2xl backdrop-blur-sm h-12 text-lg"
                            maxLength={100}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-white font-medium text-lg flex items-center gap-2">
                        <Edit className="w-4 h-4 text-cyan-300" />
                        Описание
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Опишите вашу цель подробнее..."
                        className="bg-slate-700/30 border-slate-600/50 text-white placeholder:text-white/50 focus:border-purple-400 rounded-2xl backdrop-blur-sm min-h-[120px] text-lg"
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="priority" className="text-white font-medium text-lg flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-300" />
                        Приоритет
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "low", label: "Низкий", color: "green", icon: Star },
                          { value: "medium", label: "Средний", color: "yellow", icon: Zap },
                          { value: "high", label: "Высокий", color: "red", icon: Flame },
                        ].map((priority) => (
                          <div
                            key={priority.value}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                              formData.priority === priority.value
                                ? `border-${priority.color}-400/50 bg-${priority.color}-500/10`
                                : "border-slate-600/50 bg-slate-700/30 hover:border-slate-500/50"
                            }`}
                            onClick={() => setFormData({ ...formData, priority: priority.value as any })}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <priority.icon className={`w-6 h-6 text-${priority.color}-300`} />
                              <span className={`text-${priority.color}-300 font-medium text-lg`}>{priority.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        onClick={resetForm}
                        className="bg-slate-600 hover:bg-slate-700 text-white rounded-2xl px-6 py-3"
                        disabled={isUploading}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Отменить
                      </Button>
                      <Button
                        type="submit"
                        disabled={isUploading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          <span>{editingGoal ? "Обновить" : "Создать"}</span>
                        </div>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals grid — wider layout and aligned buttons */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-7 xl:gap-8">
          {(viewMode === "my" ? goals : friendsGoals).map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="group bg-gradient-to-br from-slate-800/65 to-slate-700/60 rounded-3xl p-6 border border-slate-600/35 backdrop-blur-md shadow-xl shadow-slate-900/40 hover:shadow-purple-900/40 transition-all duration-300 will-change-transform"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {goal.user_avatar && (
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={goal.user_avatar || "/placeholder.svg?height=44&width=44&query=avatar"}
                          alt={goal.created_by_username}
                          loading="lazy"
                        />
                        <AvatarFallback className="bg-purple-500/20 text-purple-300">
                          {goal.created_by_username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">{goal.title}</h3>
                      <p className="text-white/65 text-sm truncate">{goal.created_by_username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={getPriorityColor(goal.priority)} variant="outline">
                      {getPriorityLabel(goal.priority)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        goal.status === "completed"
                          ? "bg-green-500/20 text-green-300 border-green-400/30"
                          : "bg-blue-500/20 text-blue-300 border-blue-400/30"
                      }
                    >
                      {goal.status === "completed" ? "Завершена" : "Активна"}
                    </Badge>
                  </div>
                </div>

                {/* Image */}
                {goal.image_url && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-600/40">
                    <img
                      src={goal.image_url || "/placeholder.svg?height=288&width=576&query=goal%20image"}
                      alt={goal.image_description || goal.title}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                      onClick={() => setSelectedImagePreview(goal.image_url!)}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center justify-between">
                      <p className="text-white/90 text-sm line-clamp-1">{goal.image_description || "Без описания"}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setSelectedImagePreview(goal.image_url!)}
                          size="sm"
                          className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-xl"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {viewMode === "my" && (
                          <Button
                            onClick={async () => {
                              if (!confirm("Удалить фото из цели?")) return
                              await deleteGoalImage(goal.id, goal.image_url!)
                            }}
                            size="sm"
                            className="bg-red-500/80 hover:bg-red-500 text-white border-0 rounded-xl"
                            title="Удалить фото"
                            disabled={deletingImageId === goal.id}
                          >
                            {deletingImageId === goal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {goal.description && <p className="text-white/75 text-sm line-clamp-3">{goal.description}</p>}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Прогресс</span>
                    <span className="text-white font-semibold">
                      ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage(goal.current_amount, goal.target_amount)}%` }}
                      transition={{ duration: 0.9, delay: index * 0.06 }}
                      className={`h-full rounded-full ${
                        goal.status === "completed"
                          ? "bg-gradient-to-r from-emerald-400 to-green-500"
                          : "bg-gradient-to-r from-fuchsia-400 to-pink-500"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-white/65">
                    <span>{getProgressPercentage(goal.current_amount, goal.target_amount).toFixed(1)}%</span>
                    <span>{getDaysUntilTarget(goal.target_date)} дней осталось</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={() => onCardClick(goal)}
                    size="sm"
                    className="bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600/40 rounded-xl flex-1"
                  >
                    Подробнее
                  </Button>
                  {viewMode === "my" && (
                    <>
                      <Button
                        onClick={() => handleEdit(goal)}
                        size="sm"
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Изменить
                      </Button>
                      <Button
                        onClick={() => handleToggleComplete(goal)}
                        size="sm"
                        className={`${
                          goal.status === "completed"
                            ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
                        } border rounded-xl flex-1`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {goal.status === "completed" ? "Возобновить" : "Завершить"}
                      </Button>
                      <Button
                        onClick={() => handleDelete(goal.id)}
                        size="sm"
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {(viewMode === "my" ? goals : friendsGoals).length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center ring-1 ring-purple-500/30">
                <Target className="w-12 h-12 text-purple-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {viewMode === "my" ? "У вас пока нет целей" : "Нет целей друзей"}
              </h3>
              <p className="text-white/70 max-w-md mx-auto">
                {viewMode === "my"
                  ? "Создайте свою первую финансовую цель и начните путь к успеху"
                  : "Ваши друзья еще не создали финансовые цели"}
              </p>
              {viewMode === "my" && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-8 py-3 mt-6"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Создать первую цель
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Image Preview Modal */}
        {selectedImagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImagePreview(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={() => setSelectedImagePreview(null)}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <img
                src={selectedImagePreview || "/placeholder.svg?height=600&width=1000&query=goal%20image%20preview"}
                alt="Goal Image"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Goal Details Dialog — opens when clicking a card */}
        <Dialog open={!!detailsGoal} onOpenChange={(open) => !open && setDetailsGoal(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 border border-purple-500/30">
            {detailsGoal && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl font-extrabold">{detailsGoal.title}</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Автор: {detailsGoal.created_by_username} • Цель до{" "}
                    {new Date(detailsGoal.target_date).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  {detailsGoal.image_url && (
                    <div className="rounded-2xl overflow-hidden border border-slate-700/60">
                      <img
                        src={detailsGoal.image_url || "/placeholder.svg"}
                        alt={detailsGoal.image_description || detailsGoal.title}
                        className="w-full h-72 sm:h-80 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {detailsGoal.description && (
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/60">
                      <h4 className="text-white font-semibold mb-2">Описание</h4>
                      <p className="text-white/80 leading-relaxed">{detailsGoal.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 border border-slate-700/60">
                      <div className="text-white/70 text-sm mb-1">Категория</div>
                      <div className="flex items-center gap-2 text-white font-semibold">
                        {getCategoryIcon(detailsGoal.category)}
                        {getCategoryLabel(detailsGoal.category)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 border border-slate-700/60">
                      <div className="text-white/70 text-sm mb-1">Приоритет</div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(detailsGoal.priority)} variant="outline">
                          {getPriorityLabel(detailsGoal.priority)}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 border border-slate-700/60">
                      <div className="text-white/70 text-sm mb-1">Цель</div>
                      <div className="text-white font-semibold">${detailsGoal.target_amount.toFixed(2)}</div>
                    </div>
                    <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-4 border border-slate-700/60">
                      <div className="text-white/70 text-sm mb-1">Текущие</div>
                      <div className="text-white font-semibold">${detailsGoal.current_amount.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Прогресс</span>
                      <span className="text-white font-semibold">
                        ${detailsGoal.current_amount.toFixed(2)} / ${detailsGoal.target_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${getProgressPercentage(detailsGoal.current_amount, detailsGoal.target_amount)}%`,
                        }}
                        transition={{ duration: 0.7 }}
                        className={`h-full rounded-full ${
                          detailsGoal.status === "completed"
                            ? "bg-gradient-to-r from-emerald-400 to-green-500"
                            : "bg-gradient-to-r from-fuchsia-400 to-pink-500"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/65">
                      <span>
                        {getProgressPercentage(detailsGoal.current_amount, detailsGoal.target_amount).toFixed(1)}%
                      </span>
                      <span>{getDaysUntilTarget(detailsGoal.target_date)} дней осталось</span>
                    </div>
                  </div>
                </div>

                {viewMode === "my" && (
                  <DialogFooter className="pt-2">
                    <div className="w-full flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => {
                          setDetailsGoal(null)
                          handleEdit(detailsGoal)
                        }}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Изменить
                      </Button>
                      <Button
                        onClick={() => {
                          setDetailsGoal(null)
                          handleToggleComplete(detailsGoal)
                        }}
                        className={`${
                          detailsGoal.status === "completed"
                            ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
                        } border rounded-xl flex-1`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {detailsGoal.status === "completed" ? "Возобновить" : "Завершить"}
                      </Button>
                      <Button
                        onClick={() => {
                          setDetailsGoal(null)
                          handleDelete(detailsGoal.id)
                        }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </Button>
                    </div>
                  </DialogFooter>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
