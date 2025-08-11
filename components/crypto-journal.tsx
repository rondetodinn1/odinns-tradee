"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseClient } from "@/lib/supabase"
import { activityLogger } from "@/lib/activity-logger"
import { getUserBalance } from "@/lib/auth"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Plus,
  Trash2,
  Edit,
  SortDesc,
  SortAsc,
  RefreshCw,
  Wallet,
  CheckCircle2,
  X,
  Loader2,
  BarChart2,
  ImageIcon as ImageIconLucide,
  Info,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Upload,
  FileImage,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Pin,
  PinOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

import { getUSDToUAHRate, convertUSDToUAH, formatUAH } from "@/lib/currency-converter"
import { UniversalLoading } from "@/components/loading-states"

interface Trade {
  id: string
  user_id: string
  cryptocurrency: string
  entry_point: number
  exit_point: number
  quantity: number
  details: string
  profit_loss: number
  screenshot_url?: string
  trade_type: string
  position_type?: string
  created_at: string
  updated_at: string
  username?: string
  pinned?: boolean
}

interface CryptoJournalProps {
  user: any
}

const ITEMS_PER_PAGE = 15

function parseNum(v: string | number): number {
  if (typeof v === "number") return v
  if (v === null || v === undefined) return Number.NaN
  return Number.parseFloat(String(v).replace(",", ".").trim())
}

export function CryptoJournal({ user }: CryptoJournalProps) {
  const supabase = getSupabaseClient()

  // Trade states
  const [trades, setTrades] = useState<Trade[]>([])
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
  const [isAddingTrade, setIsAddingTrade] = useState(false)
  const [isEditingTrade, setIsEditingTrade] = useState(false)
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortDirection, setSortDirection] = useState("desc")
  const [showFriendTrades, setShowFriendTrades] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")
  const [profitFilter, setProfitFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [usdToUahRate, setUsdToUahRate] = useState(41.5)
  const [friendBalance, setFriendBalance] = useState(0)
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Date filter state
  const [filterDate, setFilterDate] = useState("")

  // New trade form
  const [newTrade, setNewTrade] = useState({
    user_id: user?.id,
    cryptocurrency: "",
    entry_point: "",
    exit_point: "",
    quantity: 1,
    details: "",
    profit_loss: "",
    screenshot_url: "",
    trade_type: "trade",
    position_type: "long",
  })

  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Current balance
  const [currentBalance, setCurrentBalance] = useState(0)

  const friendUsername = user?.username === "RondetOdinn" ? "Chadee" : "RondetOdinn"
  const [lastRateUpdate, setLastRateUpdate] = useState<Date | null>(null)
  const [rateSource, setRateSource] = useState<"Live" | "Fallback">("Live")

  // ОПТИМИЗИРОВАННАЯ сортировка с мемоизацией
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      return sortDirection === "asc"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredTrades, sortDirection])

  // Закрепленные сделки
  const pinnedTrades = useMemo(() => {
    return filteredTrades
      .filter((trade) => trade.pinned)
      .sort((a, b) => {
        return sortDirection === "asc"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [filteredTrades, sortDirection])

  // ОПТИМИЗИРОВАННАЯ пагинация
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedTrades.slice(startIndex, endIndex)
  }, [sortedTrades, currentPage])

  // ОПТИМИЗИРОВАННАЯ загрузка курса валют
  const loadExchangeRate = useCallback(async () => {
    try {
      const rate = await getUSDToUAHRate()
      setUsdToUahRate(rate)
      setLastRateUpdate(new Date())
      setRateSource("Live")
    } catch (error) {
      console.error("❌ Error loading exchange rate:", error)
      setRateSource("Fallback")
    }
  }, [])

  useEffect(() => {
    console.log("🔄 CryptoJournal: User received:", user)
    if (user?.id) {
      fetchTrades()
      loadRealBalances()
    }

    loadExchangeRate()
    const rateInterval = setInterval(loadExchangeRate, 5 * 60 * 1000)

    return () => clearInterval(rateInterval)
  }, [user, loadExchangeRate])

  // ОПТИМИЗИРОВАННЫЕ фильтры с debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyTradeFilters()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [trades, searchQuery, sortDirection, showFriendTrades, typeFilter, profitFilter, positionFilter, filterDate])

  useEffect(() => {
    setCurrentPage(1)
    setTotalPages(Math.ceil(sortedTrades.length / ITEMS_PER_PAGE))
  }, [searchQuery, typeFilter, profitFilter, positionFilter, filterDate, showFriendTrades, sortedTrades.length])

  const loadRealBalances = useCallback(async () => {
    try {
      if (!user?.id) return

      const balance = await getUserBalance(user.id)
      setCurrentBalance(balance)

      const { data: friendUserData } = await supabase.from("users").select("id").eq("username", friendUsername).single()

      if (friendUserData) {
        const friendBal = await getUserBalance(friendUserData.id)
        setFriendBalance(friendBal)
      }
    } catch (error) {
      console.error("❌ Error loading balances:", error)
    }
  }, [user?.id, friendUsername, supabase])

  const calculateBalance = useCallback(async () => {
    try {
      const balance = await getUserBalance(user.id)
      setCurrentBalance(balance)

      const authData = localStorage.getItem("odinns_auth")
      if (authData) {
        const parsed = JSON.parse(authData)
        parsed.user.balance = balance
        localStorage.setItem("odinns_auth", JSON.stringify(parsed))
      }
    } catch (error) {
      console.error("❌ Error calculating balance:", error)
    }
  }, [user.id])

  // СИЛЬНО ОПТИМИЗИРОВАННАЯ загрузка сделок
  const fetchTrades = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("🔄 Fetching trades...")

      // Оптимизированный запрос с лимитом и индексацией
      const { data, error } = await supabase
        .from("crypto_journal")
        .select(`
  id,
  user_id,
  cryptocurrency,
  entry_point,
  exit_point,
  quantity,
  details,
  profit_loss,
  screenshot_url,
  trade_type,
  position_type,
  created_at,
  updated_at,
  pinned,
  users!crypto_journal_user_id_fkey (
    username
  )
`)
        .order("created_at", { ascending: false })
        .limit(500)

      if (error) throw error

      console.log("✅ Raw data from database:", data?.length || 0, "records")

      const transformedTrades = (data || []).map((entry: any) => {
        // users из реляционного запроса может быть массивом или объектом (в зависимости от конфигурации)
        const userRel = Array.isArray(entry.users) ? entry.users[0] : entry.users
        const username = userRel?.username ?? "Unknown"

        return {
          id: entry.id,
          user_id: entry.user_id,
          cryptocurrency: entry.cryptocurrency || "USD",
          entry_point: Number.parseFloat(entry.entry_point) || 0,
          exit_point: entry.exit_point ? Number.parseFloat(entry.exit_point) : 0,
          quantity: entry.quantity || 1,
          details: entry.details || "",
          profit_loss: entry.profit_loss || 0,
          screenshot_url: entry.screenshot_url || "",
          trade_type: entry.trade_type || "trade",
          position_type: entry.position_type || "long",
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          username,
          pinned: entry.pinned || false,
        }
      })

      console.log("✅ Transformed trades:", transformedTrades.length)
      setTrades(transformedTrades)
    } catch (error: any) {
      console.error("❌ Ошибка в fetchTrades:", error)
      toast.error(`Ошибка загрузки операций: ${error.message || "Неизвестная ошибка"}`)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // ОПТИМИЗИРОВАННЫЕ фильтры
  const applyTradeFilters = useCallback(() => {
    let filtered = [...trades]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (trade) => trade.cryptocurrency.toLowerCase().includes(query) || trade.details.toLowerCase().includes(query),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((trade) => trade.trade_type === typeFilter)
    }

    if (profitFilter !== "all") {
      if (profitFilter === "profit") {
        filtered = filtered.filter((trade) => trade.profit_loss > 0)
      } else if (profitFilter === "loss") {
        filtered = filtered.filter((trade) => trade.profit_loss < 0)
      } else if (profitFilter === "breakeven") {
        filtered = filtered.filter((trade) => Math.abs(trade.profit_loss) <= 1)
      }
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter((trade) => trade.position_type === positionFilter)
    }

    if (filterDate) {
      const targetDate = new Date(filterDate)
      targetDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      filtered = filtered.filter((trade) => {
        const tradeDate = new Date(trade.created_at)
        return tradeDate >= targetDate && tradeDate < nextDay
      })
    }

    if (showFriendTrades) {
      filtered = filtered.filter((trade) => trade.username === friendUsername)
    } else {
      filtered = filtered.filter((trade) => trade.user_id === user.id)
    }

    setFilteredTrades(filtered)
  }, [
    trades,
    searchQuery,
    typeFilter,
    profitFilter,
    positionFilter,
    filterDate,
    showFriendTrades,
    friendUsername,
    user.id,
  ])

  const togglePinTrade = useCallback(
    async (tradeId: string) => {
      try {
        console.log("🔄 Toggling pin for trade:", tradeId)
        const trade = trades.find((t) => t.id === tradeId)
        if (!trade) {
          console.error("❌ Trade not found:", tradeId)
          return
        }

        const newPinnedStatus = !trade.pinned
        console.log("📌 New pinned status:", newPinnedStatus)

        const { error } = await supabase.from("crypto_journal").update({ pinned: newPinnedStatus }).eq("id", tradeId)

        if (error) {
          console.error("❌ Error toggling pin:", error)
          toast.error("Ошибка при закреплении сделки")
          return
        }

        setTrades((prevTrades) => prevTrades.map((t) => (t.id === tradeId ? { ...t, pinned: newPinnedStatus } : t)))

        // Анимированный тост для закрепления
        toast.custom(
          (t) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              className="bg-gradient-to-r from-yellow-500/95 to-amber-600/95 backdrop-blur-xl border border-yellow-400/40 rounded-2xl p-4 shadow-2xl shadow-yellow-500/30 max-w-md"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="p-2 bg-white/20 rounded-xl"
                >
                  {newPinnedStatus ? <Pin className="w-6 h-6 text-white" /> : <PinOff className="w-6 h-6 text-white" />}
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {newPinnedStatus ? "Сделка закреплена! 📌" : "Сделка откреплена 📍"}
                  </p>
                  <p className="text-white/80 text-sm">{trade.cryptocurrency}</p>
                </div>
              </div>
            </motion.div>
          ),
          { duration: 3000 },
        )

        const actionType = newPinnedStatus ? "trade_pinned" : "trade_unpinned"
        const actionText = newPinnedStatus ? "закрепил" : "открепил"
        const tradeInfo = `${trade.cryptocurrency} (${trade.profit_loss >= 0 ? "+" : ""}$${trade.profit_loss.toFixed(2)})`

        await activityLogger.logActivity(user.id, actionType, `${user.username} ${actionText} сделку ${tradeInfo}`, {
          trade_id: tradeId,
          cryptocurrency: trade.cryptocurrency,
          profit_loss: trade.profit_loss,
          action: actionText,
        })
      } catch (error) {
        console.error("❌ Error in togglePinTrade:", error)
        toast.error("Ошибка при изменении статуса закрепления")
      }
    },
    [trades, supabase, user.id, user.username],
  )

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    try {
      setIsUploading(true)

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64String = reader.result as string
          console.log("📷 Image converted to base64, size:", base64String.length)
          resolve(base64String)
        }
        reader.onerror = () => {
          console.error("❌ Error reading file")
          reject(new Error("Error reading file"))
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error("❌ Error processing image:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Файл слишком большой. Максимальный размер: 5MB")
        return
      }
      setSelectedFile(file)
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Файл слишком большой. Максимальный размер: 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Пожалуйста, выберите изображение")
        return
      }
      setSelectedFile(file)
    }
  }, [])

  const validateTradeForm = useCallback(() => {
    const entry = parseNum(newTrade.entry_point)
    const exit = parseNum(newTrade.exit_point)

    if (newTrade.trade_type === "trade") {
      if (!isFinite(entry) || entry <= 0) {
        toast.error("Введите корректную цену входа")
        return false
      }
      if (!isFinite(exit) || exit <= 0) {
        toast.error("Введите корректную цену выхода")
        return false
      }
    }

    const pl = parseNum(newTrade.profit_loss)
    if (!isFinite(pl)) {
      toast.error("Введите сумму операции")
      return false
    }

    return true
  }, [newTrade])

  const handleAddTrade = useCallback(async () => {
    if (!user?.id) {
      toast.error("Вы не авторизованы. Войдите, чтобы добавить операцию.")
      return
    }

    if (!validateTradeForm()) {
      return
    }

    try {
      setIsSaving(true)
      console.log("🔄 Adding new trade...")

      let screenshotUrl = newTrade.screenshot_url

      if (selectedFile) {
        screenshotUrl = await uploadImage(selectedFile)
        console.log("📷 Screenshot URL set:", screenshotUrl ? "Yes" : "No")
      }

      setFormError(null)
      let profitLoss = parseNum(newTrade.profit_loss)
      if (!isFinite(profitLoss)) profitLoss = 0

      if (["expense", "card_withdrawal", "wallet_withdrawal"].includes(newTrade.trade_type)) {
        profitLoss = -Math.abs(profitLoss)
      } else if (["income"].includes(newTrade.trade_type)) {
        profitLoss = Math.abs(profitLoss)
      }

      const entryPointStr = newTrade.entry_point ? String(newTrade.entry_point).replace(",", ".") : "0"
      const exitPointStr = newTrade.exit_point ? String(newTrade.exit_point).replace(",", ".") : "0"

      const journalEntry = {
        user_id: user.id,
        cryptocurrency: newTrade.cryptocurrency || "USD",
        entry_point: entryPointStr,
        exit_point: exitPointStr,
        quantity: newTrade.quantity || 1,
        details: newTrade.details,
        profit_loss: profitLoss,
        screenshot_url: screenshotUrl,
        trade_type: newTrade.trade_type,
        position_type: newTrade.position_type || "long",
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("💾 Journal entry to save:", journalEntry)

      const { data: tradeData, error: tradeError } = await supabase
        .from("crypto_journal")
        .insert([journalEntry])
        .select()

      if (tradeError) {
        console.error("❌ Ошибка добавления операции:", tradeError)
        setFormError(tradeError?.message || "Ошибка добавления операции")
        toast.error(`Ошибка добавления операции: ${tradeError.message}`)
        return
      }

      console.log("✅ Trade added successfully:", tradeData)

      // Анимированный тост для добавления сделки
      toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className={`bg-gradient-to-r ${
              profitLoss >= 0
                ? "from-green-500/95 to-emerald-600/95 border-green-400/40 shadow-green-500/30"
                : "from-red-500/95 to-rose-600/95 border-red-400/40 shadow-red-500/30"
            } backdrop-blur-xl border rounded-2xl p-4 shadow-2xl max-w-md`}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="p-2 bg-white/20 rounded-xl"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {newTrade.trade_type === "trade"
                    ? profitLoss >= 0
                      ? "Прибыльная сделка добавлена! 🚀"
                      : "Сделка зафиксирована 📊"
                    : "Операция добавлена! ✅"}
                </p>
                <p className="text-white/80 text-sm">
                  {newTrade.cryptocurrency}: {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        ),
        { duration: 5000 },
      )

      try {
        const tradeInfo = `${newTrade.cryptocurrency} (${profitLoss >= 0 ? "+" : ""}$${profitLoss.toFixed(2)})`

        if (newTrade.trade_type === "trade") {
          await activityLogger.logActivity(
            user.id,
            "trade_added",
            `${user.username} добавил торговую сделку ${tradeInfo}`,
            {
              cryptocurrency: newTrade.cryptocurrency,
              profit_loss: profitLoss,
              trade_type: newTrade.trade_type,
              position_type: newTrade.position_type,
              entry_point: newTrade.entry_point,
              exit_point: newTrade.exit_point,
            },
          )
        } else {
          await activityLogger.logActivity(
            user.id,
            "operation_added",
            `${user.username} добавил операцию ${getTradeTypeLabel(newTrade.trade_type)}: ${tradeInfo}`,
            {
              operation_type: newTrade.trade_type,
              amount: profitLoss,
              cryptocurrency: newTrade.cryptocurrency,
            },
          )
        }
      } catch (activityError) {
        console.error("❌ Error logging activity:", activityError)
      }

      setIsAddingTrade(false)
      resetTradeForm()
      fetchTrades()
      calculateBalance()
    } catch (error) {
      console.error("❌ Ошибка в handleAddTrade:", error)
      setFormError("Ошибка добавления операции")
      toast.error("Ошибка добавления операции")
    } finally {
      setIsSaving(false)
    }
  }, [
    validateTradeForm,
    newTrade,
    selectedFile,
    uploadImage,
    user?.id,
    user?.username,
    supabase,
    fetchTrades,
    calculateBalance,
  ])

  const handleEditTrade = useCallback(async () => {
    if (!currentTrade) return

    if (!validateTradeForm()) {
      return
    }

    try {
      setIsSaving(true)
      console.log("🔄 Editing trade:", currentTrade.id)

      let screenshotUrl = newTrade.screenshot_url

      if (selectedFile) {
        screenshotUrl = await uploadImage(selectedFile)
      }

      let profitLoss = parseNum(newTrade.profit_loss)
      if (!isFinite(profitLoss)) profitLoss = 0

      if (["expense", "card_withdrawal", "wallet_withdrawal"].includes(newTrade.trade_type)) {
        profitLoss = -Math.abs(profitLoss)
      } else if (["income"].includes(newTrade.trade_type)) {
        profitLoss = Math.abs(profitLoss)
      }

      const entryPointStr = newTrade.entry_point ? String(newTrade.entry_point).replace(",", ".") : "0"
      const exitPointStr = newTrade.exit_point ? String(newTrade.exit_point).replace(",", ".") : "0"

      const updatedTrade = {
        cryptocurrency: newTrade.cryptocurrency || "USD",
        entry_point: entryPointStr,
        exit_point: exitPointStr,
        quantity: newTrade.quantity || 1,
        details: newTrade.details,
        profit_loss: profitLoss,
        screenshot_url: screenshotUrl,
        trade_type: newTrade.trade_type,
        position_type: newTrade.position_type || "long",
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("crypto_journal").update(updatedTrade).eq("id", currentTrade.id)

      if (error) {
        console.error("❌ Ошибка обновления операции:", error)
        toast.error("Ошибка обновления операции")
        return
      }

      // Анимированный тост для редактирования
      toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            className="bg-gradient-to-r from-blue-500/95 to-cyan-600/95 backdrop-blur-xl border border-blue-400/40 rounded-2xl p-4 shadow-2xl shadow-blue-500/30 max-w-md"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="p-2 bg-white/20 rounded-xl"
              >
                <Edit className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="text-white font-semibold">Сделка обновлена! 📈</p>
                <p className="text-white/80 text-sm">
                  {newTrade.cryptocurrency}: {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        ),
        { duration: 4000 },
      )

      try {
        const tradeInfo = `${newTrade.cryptocurrency} (${profitLoss >= 0 ? "+" : ""}$${profitLoss.toFixed(2)})`

        if (newTrade.trade_type === "trade") {
          await activityLogger.logActivity(
            user.id,
            "trade_edited",
            `${user.username} отредактировал торговую сделку ${tradeInfo}`,
            {
              cryptocurrency: newTrade.cryptocurrency,
              profit_loss: profitLoss,
              trade_type: newTrade.trade_type,
              position_type: newTrade.position_type,
              trade_id: currentTrade.id,
            },
          )
        } else {
          await activityLogger.logActivity(
            user.id,
            "operation_edited",
            `${user.username} отредактировал операцию ${getTradeTypeLabel(newTrade.trade_type)}: ${tradeInfo}`,
            {
              operation_type: newTrade.trade_type,
              amount: profitLoss,
              cryptocurrency: newTrade.cryptocurrency,
              trade_id: currentTrade.id,
            },
          )
        }
      } catch (activityError) {
        console.error("❌ Error logging activity:", activityError)
      }

      setIsEditingTrade(false)
      setCurrentTrade(null)
      resetTradeForm()
      fetchTrades()
      calculateBalance()
    } catch (error) {
      console.error("❌ Ошибка в handleEditTrade:", error)
      toast.error("Ошибка обновления операции")
    } finally {
      setIsSaving(false)
    }
  }, [
    currentTrade,
    validateTradeForm,
    newTrade,
    selectedFile,
    uploadImage,
    supabase,
    user.id,
    user.username,
    fetchTrades,
    calculateBalance,
  ])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setFormError(null)
      if (isEditingTrade) {
        await handleEditTrade()
      } else {
        await handleAddTrade()
      }
    },
    [isEditingTrade, handleAddTrade, handleEditTrade],
  )

  const handleDeleteTrade = useCallback(
    async (id: string) => {
      if (!confirm("Вы уверены, что хотите удалить эту операцию?")) {
        return
      }

      try {
        console.log("🗑️ Deleting trade:", id)
        const tradeToDelete = trades.find((t) => t.id === id)
        if (!tradeToDelete) return

        const { error } = await supabase.from("crypto_journal").delete().eq("id", id)

        if (error) {
          console.error("❌ Ошибка удаления операции:", error)
          toast.error("Ошибка удаления операции")
          return
        }

        // Анимированный тост для удаления
        toast.custom(
          (t) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -100 }}
              className="bg-gradient-to-r from-red-500/95 to-rose-600/95 backdrop-blur-xl border border-red-400/40 rounded-2xl p-4 shadow-2xl shadow-red-500/30 max-w-md"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="p-2 bg-white/20 rounded-xl"
                >
                  <Trash2 className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Операция удалена! 🗑️</p>
                  <p className="text-white/80 text-sm">{tradeToDelete.cryptocurrency}</p>
                </div>
              </div>
            </motion.div>
          ),
          { duration: 3000 },
        )

        try {
          const tradeInfo = `${tradeToDelete.cryptocurrency} (${tradeToDelete.profit_loss >= 0 ? "+" : ""}$${tradeToDelete.profit_loss.toFixed(2)})`

          if (tradeToDelete.trade_type === "trade") {
            await activityLogger.logActivity(
              user.id,
              "trade_deleted",
              `${user.username} удалил торговую сделку ${tradeInfo}`,
              {
                cryptocurrency: tradeToDelete.cryptocurrency,
                trade_type: tradeToDelete.trade_type,
                profit_loss: tradeToDelete.profit_loss,
              },
            )
          } else {
            await activityLogger.logActivity(
              user.id,
              "operation_deleted",
              `${user.username} удалил операцию ${getTradeTypeLabel(tradeToDelete.trade_type)}: ${tradeInfo}`,
              {
                operation_type: tradeToDelete.trade_type,
                cryptocurrency: tradeToDelete.cryptocurrency,
                amount: tradeToDelete.profit_loss,
              },
            )
          }
        } catch (activityError) {
          console.error("❌ Error logging activity:", activityError)
        }

        fetchTrades()
        calculateBalance()
      } catch (error) {
        console.error("❌ Ошибка в handleDeleteTrade:", error)
        toast.error("Ошибка удаления операции")
      }
    },
    [trades, supabase, user.id, user.username, fetchTrades, calculateBalance],
  )

  const resetTradeForm = useCallback(() => {
    setNewTrade({
      user_id: user?.id,
      cryptocurrency: "",
      entry_point: "",
      exit_point: "",
      quantity: 1,
      details: "",
      profit_loss: "",
      screenshot_url: "",
      trade_type: "trade",
      position_type: "long",
    })
    setSelectedFile(null)
  }, [user?.id])

  const startEditTrade = useCallback((trade: Trade) => {
    console.log("✏️ Starting edit trade:", trade.id)
    setCurrentTrade(trade)
    setNewTrade({
      user_id: trade.user_id,
      cryptocurrency: trade.cryptocurrency,
      entry_point: trade.entry_point.toString(),
      exit_point: trade.exit_point.toString(),
      quantity: trade.quantity || 1,
      details: trade.details,
      profit_loss: Math.abs(trade.profit_loss).toString(),
      screenshot_url: trade.screenshot_url || "",
      trade_type: trade.trade_type,
      position_type: trade.position_type || "long",
    })
    setIsEditingTrade(true)
  }, [])

  const handleTradeClick = useCallback((trade: Trade) => {
    setSelectedTradeDetails(trade)
  }, [])

  const getTradeTypeLabel = useCallback((type: string) => {
    const types = {
      trade: "Торговля",
      income: "Доход",
      expense: "Расход",
      card_withdrawal: "Вывод на карточку",
      wallet_withdrawal: "Вывод на кошелек",
    }
    return types[type as keyof typeof types] || type
  }, [])

  const getTradeTypeBadgeColor = useCallback((type: string) => {
    const colors = {
      trade: "bg-blue-500/20 text-blue-300 border-blue-400/20",
      income: "bg-emerald-500/20 text-emerald-300 border-emerald-400/20",
      expense: "bg-orange-500/20 text-orange-300 border-orange-400/20",
      card_withdrawal: "bg-red-500/20 text-red-300 border-red-400/20",
      wallet_withdrawal: "bg-purple-500/20 text-purple-300 border-purple-400/20",
    }
    return colors[type as keyof typeof colors] || "bg-gray-500/20 text-gray-300 border-gray-400/20"
  }, [])

  const getPositionTypeLabel = useCallback((type: string) => {
    return type === "long" ? "Лонг" : "Шорт"
  }, [])

  const getPositionTypeBadgeColor = useCallback((type: string) => {
    return type === "long"
      ? "bg-green-500/20 text-green-300 border-green-400/20"
      : "bg-red-500/20 text-red-300 border-red-400/20"
  }, [])

  // ОПТИМИЗИРОВАННАЯ статистика
  const getFilteredStats = useMemo(() => {
    const tradingOperations = filteredTrades.filter((trade) => trade.trade_type === "trade")

    const profitTrades = tradingOperations.filter((trade) => trade.profit_loss > 0)
    const lossTrades = tradingOperations.filter((trade) => trade.profit_loss < 0)
    const breakevenTrades = tradingOperations.filter((trade) => Math.abs(trade.profit_loss) <= 1)

    const totalProfit = profitTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)
    const totalLoss = lossTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)

    // Статистика за сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTrades = tradingOperations.filter((trade) => {
      const tradeDate = new Date(trade.created_at)
      return tradeDate >= today && tradeDate < tomorrow
    })

    return {
      total: tradingOperations.length,
      profit: profitTrades.length,
      loss: lossTrades.length,
      breakeven: breakevenTrades.length,
      totalProfit,
      totalLoss,
      netPnL: totalProfit + totalLoss,
      todayTrades: todayTrades.length,
    }
  }, [filteredTrades])

  // Pagination handlers
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages],
  )

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage])
  const goToLastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages])
  const goToPreviousPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage])
  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage])

  // ОПТИМИЗИРОВАННЫЙ рендер строки таблицы
  const renderTradeRow = useCallback(
    (trade: Trade, index: number) => (
      <motion.tr
        key={trade.id}
        className={`border-white/10 hover:bg-white/5 transition-all duration-200 cursor-pointer ${trade.pinned ? "bg-yellow-500/5 border-yellow-500/20" : ""}`}
        onClick={() => handleTradeClick(trade)}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: index * 0.01 }}
        whileHover={{
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          scale: 1.005,
          transition: { duration: 0.15 },
        }}
      >
        <TableCell className="text-white/80 py-3 align-middle">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{new Date(trade.created_at).toLocaleDateString("ru-RU")}</div>
              <div className="text-xs text-white/50">
                {new Date(trade.created_at).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            {trade.pinned && <Pin className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
          </div>
        </TableCell>
        <TableCell className="py-3 align-middle">
          <Badge className={`${getTradeTypeBadgeColor(trade.trade_type)} text-xs px-2 py-1 whitespace-nowrap`}>
            {getTradeTypeLabel(trade.trade_type)}
          </Badge>
        </TableCell>
        <TableCell className="text-white font-medium py-3 text-sm align-middle">{trade.cryptocurrency}</TableCell>
        <TableCell className="py-3 align-middle">
          {trade.trade_type === "trade" ? (
            <Badge
              className={`${getPositionTypeBadgeColor(trade.position_type || "long")} text-xs px-2 py-1 whitespace-nowrap`}
            >
              <div className="flex items-center gap-1">
                {trade.position_type === "long" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {getPositionTypeLabel(trade.position_type || "long")}
              </div>
            </Badge>
          ) : (
            <span className="text-xs text-white/40">-</span>
          )}
        </TableCell>
        <TableCell className="py-3 align-middle">
          <div className="flex flex-col gap-1 min-w-0">
            <span
              className={`font-bold text-sm ${trade.profit_loss >= 0 ? "text-emerald-400" : "text-red-400"} whitespace-nowrap`}
            >
              {trade.profit_loss >= 0 ? "+" : ""}${trade.profit_loss.toFixed(2)}
            </span>
            <span className="text-xs text-blue-300 whitespace-nowrap">
              {formatUAH(convertUSDToUAH(trade.profit_loss, usdToUahRate))}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-3 align-middle text-center">
          {trade.screenshot_url ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImagePreview(trade.screenshot_url ?? null)
                }}
                size="sm"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg h-7 w-7 p-0 transition-all duration-200"
              >
                <Eye className="w-3 h-3" />
              </Button>
            </motion.div>
          ) : (
            <span className="text-xs text-white/40">-</span>
          )}
        </TableCell>
        <TableCell className="text-white/70 max-w-xs py-3 text-sm align-middle">
          <div className="truncate text-sm" title={trade.details || "Без описания"}>
            {trade.details || "Без описания"}
          </div>
        </TableCell>
        <TableCell className="py-3 align-middle">
          <div className="flex items-center gap-1 justify-end">
            {trade.user_id === user.id && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePinTrade(trade.id)
                    }}
                    size="sm"
                    className={`${
                      trade.pinned
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                        : "bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30"
                    } rounded-lg h-7 w-7 p-0 transition-all duration-200`}
                  >
                    {trade.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditTrade(trade)
                    }}
                    size="sm"
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 rounded-lg h-7 w-7 p-0 transition-all duration-200"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTrade(trade.id)
                    }}
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg h-7 w-7 p-0 transition-all duration-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </TableCell>
      </motion.tr>
    ),
    [
      handleTradeClick,
      getTradeTypeBadgeColor,
      getTradeTypeLabel,
      getPositionTypeBadgeColor,
      getPositionTypeLabel,
      usdToUahRate,
      user.id,
      togglePinTrade,
      startEditTrade,
      handleDeleteTrade,
    ],
  )

  if (isLoading) {
    return <UniversalLoading title="Загрузка журнала..." subtitle="Подготавливаем финансовые операции" />
  }

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Компактный Header */}
      <motion.div
        className="bg-gradient-to-r from-slate-800/50 via-purple-900/30 to-slate-800/50 rounded-xl p-3 sm:p-4 border border-purple-500/30 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Финансовый Журнал
            </h2>
            <p className="text-white/60 mt-1 text-xs sm:text-sm">Отслеживайте все свои финансовые операции</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <motion.div
              className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-lg border border-emerald-500/30 px-3 py-2 flex flex-col gap-1 backdrop-blur-sm w-full sm:min-w-[200px]"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-emerald-400" />
                  <span className="text-white font-medium text-xs">
                    {showFriendTrades ? `Баланс ${friendUsername}:` : "Баланс:"}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${(showFriendTrades ? friendBalance : currentBalance) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  ${(showFriendTrades ? friendBalance : currentBalance).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-300">
                  {formatUAH(convertUSDToUAH(showFriendTrades ? friendBalance : currentBalance, usdToUahRate))}
                </span>
                <div className="text-right">
                  <div className="text-xs text-white/60">Курс: {usdToUahRate.toFixed(2)}</div>
                  <div className={`text-xs ${rateSource === "Live" ? "text-green-400" : "text-yellow-400"}`}>
                    {rateSource === "Live" ? "Онлайн" : "Офлайн"}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Компактная статистика */}
      {filteredTrades.filter((trade) => trade.trade_type === "trade").length > 0 && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-300">Торговых сделок</p>
                    <p className="text-sm sm:text-lg font-bold text-blue-100">{getFilteredStats.total}</p>
                    <p className="text-xs text-blue-300">Сегодня: {getFilteredStats.todayTrades}</p>
                  </div>
                  <BarChart2 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-300">Прибыльные</p>
                    <p className="text-sm sm:text-lg font-bold text-emerald-100">{getFilteredStats.profit}</p>
                    <p className="text-xs text-emerald-300">+${getFilteredStats.totalProfit.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-300">Убыточные</p>
                    <p className="text-sm sm:text-lg font-bold text-red-100">{getFilteredStats.loss}</p>
                    <p className="text-xs text-red-300">${getFilteredStats.totalLoss.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-300">Торговый P&L</p>
                    <p
                      className={`text-sm sm:text-lg font-bold ${getFilteredStats.netPnL >= 0 ? "text-emerald-100" : "text-red-100"}`}
                    >
                      {getFilteredStats.netPnL >= 0 ? "+" : ""}${getFilteredStats.netPnL.toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-300">
                      Винрейт:{" "}
                      {getFilteredStats.total > 0
                        ? ((getFilteredStats.profit / getFilteredStats.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-xl shadow-purple-500/10 transition-all duration-300 hover:shadow-purple-500/20">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-purple-500/20 p-3 sm:p-4">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              Все Операции
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Dialog
                open={isAddingTrade || isEditingTrade}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsAddingTrade(false)
                    setIsEditingTrade(false)
                    setCurrentTrade(null)
                    resetTradeForm()
                    setFormError(null)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => {
                        if (showFriendTrades) setShowFriendTrades(false)
                        setIsAddingTrade(true)
                        setFormError(null)
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-500/25 h-8 text-xs px-3 transition-all duration-300"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить
                    </Button>
                  </motion.div>
                </DialogTrigger>

                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 text-white rounded-xl max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      </motion.div>
                      {isEditingTrade ? "Редактировать Операцию" : "Новая Операция"}
                    </DialogTitle>
                  </DialogHeader>

                  {formError && (
                    <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-200">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <motion.div
                      className="grid gap-4 py-4 px-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Operation Type */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-purple-400" />
                          Тип Операции
                        </label>
                        <Select
                          value={newTrade.trade_type}
                          onValueChange={(value) => setNewTrade({ ...newTrade, trade_type: value })}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-10 text-sm hover:bg-white/15 transition-all duration-300">
                            <SelectValue placeholder="Выберите тип операции" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="trade" className="text-white hover:bg-slate-700 py-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                <span className="text-sm">Торговля</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="income" className="text-white hover:bg-slate-700 py-2">
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-green-400" />
                                <span className="text-sm">Доход</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="expense" className="text-white hover:bg-slate-700 py-2">
                              <div className="flex items-center gap-2">
                                <ArrowDownRight className="w-4 h-4 text-orange-400" />
                                <span className="text-sm">Расход</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="card_withdrawal" className="text-white hover:bg-slate-700 py-2">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-red-400" />
                                <span className="text-sm">Вывод на карточку</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="wallet_withdrawal" className="text-white hover:bg-slate-700 py-2">
                              <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-purple-400" />
                                <span className="text-sm">Вывод на кошелек</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Cryptocurrency */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          {newTrade.trade_type === "trade" ? "Криптовалюта" : "Валюта/Актив"}
                        </label>
                        <Input
                          value={newTrade.cryptocurrency}
                          onChange={(e) => setNewTrade({ ...newTrade, cryptocurrency: e.target.value })}
                          placeholder={newTrade.trade_type === "trade" ? "BTC, ETH, USDT..." : "USD, EUR, Акции..."}
                          className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-10 text-sm hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                          required
                        />
                      </motion.div>

                      {/* Trading Fields */}
                      <AnimatePresence>
                        {newTrade.trade_type === "trade" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            {/* Position Type */}
                            <motion.div
                              className="space-y-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.25 }}
                            >
                              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-cyan-400" />
                                Тип позиции
                              </label>
                              <Select
                                value={newTrade.position_type}
                                onValueChange={(value) => setNewTrade({ ...newTrade, position_type: value })}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-10 text-sm hover:bg-white/15 transition-all duration-300">
                                  <SelectValue placeholder="Выберите тип позиции" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  <SelectItem value="long" className="text-white hover:bg-slate-700 py-2">
                                    <div className="flex items-center gap-2">
                                      <ArrowUp className="w-4 h-4 text-green-400" />
                                      <span className="text-sm">Лонг (Long)</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="short" className="text-white hover:bg-slate-700 py-2">
                                    <div className="flex items-center gap-2">
                                      <ArrowDown className="w-4 h-4 text-red-400" />
                                      <span className="text-sm">Шорт (Short)</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>

                            <div className="grid grid-cols-2 gap-3">
                              <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                              >
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                  <ArrowDownRight className="w-4 h-4 text-green-400" />
                                  Цена входа
                                </label>
                                <Input
                                  type="text"
                                  value={newTrade.entry_point}
                                  onChange={(e) => setNewTrade({ ...newTrade, entry_point: e.target.value })}
                                  placeholder="0.000010149"
                                  className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-10 text-sm hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                                  required
                                />
                              </motion.div>
                              <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                              >
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                                  Цена выхода
                                </label>
                                <Input
                                  type="text"
                                  value={newTrade.exit_point}
                                  onChange={(e) => setNewTrade({ ...newTrade, exit_point: e.target.value })}
                                  placeholder="0.000012345"
                                  className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-10 text-sm hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                                  required
                                />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Profit/Loss */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                      >
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          {newTrade.trade_type === "trade" ? "Прибыль/Убыток ($)" : "Сумма ($)"}
                        </label>
                        <Input
                          type="number"
                          step="any"
                          required
                          min="-999999"
                          max="999999"
                          value={newTrade.profit_loss}
                          onChange={(e) => setNewTrade({ ...newTrade, profit_loss: e.target.value })}
                          placeholder="0.00"
                          className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-10 text-sm hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                        />
                      </motion.div>

                      {/* Description */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.7 }}
                      >
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <Info className="w-4 h-4 text-cyan-400" />
                          Описание
                        </label>
                        <Textarea
                          value={newTrade.details}
                          onChange={(e) => setNewTrade({ ...newTrade, details: e.target.value })}
                          placeholder="Добавьте описание операции..."
                          className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm min-h-[80px] resize-none text-sm hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                        />
                      </motion.div>

                      {/* Screenshot Upload */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                      >
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                          <ImageIconLucide className="w-4 h-4 text-purple-400" />
                          Скриншот (опционально)
                        </label>

                        <div
                          className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 transition-all duration-300 ${
                            dragActive
                              ? "border-purple-400 bg-purple-500/10"
                              : "border-white/20 hover:border-purple-400/50 hover:bg-white/5"
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
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center justify-center gap-3"
                              >
                                <FileImage className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                                <div>
                                  <p className="text-green-400 font-medium text-sm">{selectedFile.name}</p>
                                  <p className="text-white/60 text-xs">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => setSelectedFile(null)}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white/40 mx-auto" />
                                <div>
                                  <p className="text-white/70 text-sm">Перетащите изображение сюда или</p>
                                  <p className="text-purple-400 font-medium text-sm">нажмите для выбора</p>
                                </div>
                                <p className="text-white/50 text-xs">PNG, JPG до 5MB</p>
                              </div>
                            )}

                            {isUploading && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"
                              >
                                <div className="flex items-center gap-2 text-white">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Загрузка...</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>

                      {/* Validation Warning */}
                      <AnimatePresence>
                        {!newTrade.cryptocurrency && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <p className="text-yellow-200 text-sm">Заполните все обязательные поля</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <DialogFooter className="flex gap-3 pt-4 border-t border-white/10">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => {
                            setIsAddingTrade(false)
                            setIsEditingTrade(false)
                            setCurrentTrade(null)
                            resetTradeForm()
                            setFormError(null)
                          }}
                          className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg h-10 text-sm px-4 transition-all duration-300"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Отмена
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-500/25 h-10 text-sm px-4 transition-all duration-300"
                          disabled={isSaving || isUploading || !newTrade.cryptocurrency}
                        >
                          {isSaving ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Сохранение...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isEditingTrade ? "Сохранить" : "Добавить"}</span>
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowFriendTrades(!showFriendTrades)}
                  className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-8 text-xs px-3 ${
                    showFriendTrades
                      ? "bg-purple-600 hover:bg-purple-700 text-white border border-purple-500/50"
                      : "bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white"
                  }`}
                >
                  {showFriendTrades ? "Мои Операции" : `Операции ${friendUsername}`}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={fetchTrades}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-8 text-xs px-3"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4">
            {/* Компактные фильтры */}
            <motion.div
              className="flex flex-col gap-3 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Search and Date Filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-3 h-3" />
                  <Input
                    placeholder="Поиск по валюте или описанию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-8 text-xs hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-8 text-xs hover:bg-white/15 focus:bg-white/15 transition-all duration-300"
                    placeholder="Дата"
                  />
                </div>
              </div>

              {/* Type and Profit Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-40 bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-8 text-xs hover:bg-white/15 transition-all duration-300">
                    <SelectValue placeholder="Тип операции" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">
                      Все операции
                    </SelectItem>
                    <SelectItem value="trade" className="text-white hover:bg-slate-700">
                      Торговля
                    </SelectItem>
                    <SelectItem value="income" className="text-white hover:bg-slate-700">
                      Доходы
                    </SelectItem>
                    <SelectItem value="expense" className="text-white hover:bg-slate-700">
                      Расходы
                    </SelectItem>
                    <SelectItem value="card_withdrawal" className="text-white hover:bg-slate-700">
                      Вывод на карточку
                    </SelectItem>
                    <SelectItem value="wallet_withdrawal" className="text-white hover:bg-slate-700">
                      Вывод на кошелек
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={profitFilter} onValueChange={setProfitFilter}>
                  <SelectTrigger className="w-full md:w-40 bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-8 text-xs hover:bg-white/15 transition-all duration-300">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="По результату" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">
                      Все результаты
                    </SelectItem>
                    <SelectItem value="profit" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Только прибыльные
                      </div>
                    </SelectItem>
                    <SelectItem value="loss" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        Только убыточные
                      </div>
                    </SelectItem>
                    <SelectItem value="breakeven" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-gray-400" />В ноль
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-full md:w-40 bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm h-8 text-xs hover:bg-white/15 transition-all duration-300">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Тип позиции" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">
                      Все позиции
                    </SelectItem>
                    <SelectItem value="long" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        Только лонг
                      </div>
                    </SelectItem>
                    <SelectItem value="short" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-3 h-3 text-red-400" />
                        Только шорт
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                    className="bg-white/10 border-white/20 text-white rounded-lg backdrop-blur-sm hover:bg-white/20 h-8 text-xs px-3 transition-all duration-300"
                  >
                    {sortDirection === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Компактные табы */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 rounded-xl p-1 mb-4">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70 rounded-lg transition-all duration-300 text-xs"
                >
                  Все операции ({sortedTrades.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pinned"
                  className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-white/70 rounded-lg transition-all duration-300 text-xs"
                >
                  Закрепленные ({pinnedTrades.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {/* All Trades Table */}
                <AnimatePresence mode="wait">
                  {sortedTrades.length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {showFriendTrades ? `Нет операций у ${friendUsername}` : "Нет операций"}
                      </h3>
                      <p className="text-white/60 mb-4 text-sm">
                        {showFriendTrades
                          ? `${friendUsername} еще не добавил операции`
                          : "Добавьте свою первую операцию, чтобы начать отслеживание"}
                      </p>
                      {!showFriendTrades && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => setIsAddingTrade(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-500/25 h-8 text-xs px-3"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Добавить первую операцию
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                              <TableHead className="text-white/70 font-medium text-xs py-3">Дата</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Тип</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Валюта</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Позиция</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Сумма</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3 text-center">Фото</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Описание</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3 text-right">
                                Действия
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>{paginatedTrades.map((trade, index) => renderTradeRow(trade, index))}</TableBody>
                        </Table>
                      </div>

                      {/* Компактная пагинация */}
                      {totalPages > 1 && (
                        <motion.div
                          className="flex items-center justify-between mt-4 p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-white/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={goToFirstPage}
                              disabled={currentPage === 1}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              <ChevronsLeft className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={goToPreviousPage}
                              disabled={currentPage === 1}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1 text-white">
                            <span className="text-xs">
                              Страница {currentPage} из {totalPages}
                            </span>
                            <span className="text-xs text-white/60">({sortedTrades.length} операций)</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              onClick={goToNextPage}
                              disabled={currentPage === totalPages}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={goToLastPage}
                              disabled={currentPage === totalPages}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              <ChevronsRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="pinned" className="space-y-3">
                {/* Pinned Trades Table */}
                <AnimatePresence mode="wait">
                  {pinnedTrades.length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Pin className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Нет закрепленных операций</h3>
                      <p className="text-white/60 mb-4 text-sm">
                        Закрепите важные операции, чтобы они отображались здесь
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                              <TableHead className="text-white/70 font-medium text-xs py-3">Дата</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Тип</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Валюта</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Позиция</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Сумма</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3 text-center">Фото</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3">Описание</TableHead>
                              <TableHead className="text-white/70 font-medium text-xs py-3 text-right">
                                Действия
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>{pinnedTrades.map((trade, index) => renderTradeRow(trade, index))}</TableBody>
                        </Table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trade Details Modal */}
      <Dialog
        open={!!selectedTradeDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedTradeDetails(null)
        }}
      >
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 text-white rounded-xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              Детали Операции
            </DialogTitle>
          </DialogHeader>

          {selectedTradeDetails && (
            <motion.div
              className="space-y-4 py-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header Info */}
              <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedTradeDetails.profit_loss >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                      }`}
                    >
                      {selectedTradeDetails.profit_loss >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedTradeDetails.cryptocurrency}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getTradeTypeBadgeColor(selectedTradeDetails.trade_type)} text-xs`}>
                          {getTradeTypeLabel(selectedTradeDetails.trade_type)}
                        </Badge>
                        {selectedTradeDetails.trade_type === "trade" && (
                          <Badge
                            className={`${getPositionTypeBadgeColor(selectedTradeDetails.position_type || "long")} text-xs`}
                          >
                            <div className="flex items-center gap-1">
                              {selectedTradeDetails.position_type === "long" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )}
                              {getPositionTypeLabel(selectedTradeDetails.position_type || "long")}
                            </div>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${
                        selectedTradeDetails.profit_loss >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {selectedTradeDetails.profit_loss >= 0 ? "+" : ""}${selectedTradeDetails.profit_loss.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-300">
                      {formatUAH(convertUSDToUAH(selectedTradeDetails.profit_loss, usdToUahRate))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-white/60">Дата создания</span>
                  </div>
                  <div className="text-sm text-white">
                    {new Date(selectedTradeDetails.created_at).toLocaleString("ru-RU")}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-white/60">Валюта</span>
                  </div>
                  <div className="text-sm text-white font-medium">{selectedTradeDetails.cryptocurrency}</div>
                </div>

                {selectedTradeDetails.trade_type === "trade" && (
                  <>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowDownRight className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-white/60">Цена входа</span>
                      </div>
                      <div className="text-sm text-white">{selectedTradeDetails.entry_point}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowUpRight className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-white/60">Цена выхода</span>
                      </div>
                      <div className="text-sm text-white">{selectedTradeDetails.exit_point}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {selectedTradeDetails.details && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs text-white/60">Описание</span>
                  </div>
                  <div className="text-sm text-white/80">{selectedTradeDetails.details}</div>
                </div>
              )}

              {/* Screenshot */}
              {selectedTradeDetails.screenshot_url && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIconLucide className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-white/60">Скриншот</span>
                  </div>
                  <motion.div
                    className="relative rounded-lg overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedImagePreview(selectedTradeDetails.screenshot_url ?? null)}
                  >
                    <img
                      src={selectedTradeDetails.screenshot_url || "/placeholder.svg"}
                      alt="Trade Screenshot"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog
        open={!!selectedImagePreview}
        onOpenChange={(open) => {
          if (!open) setSelectedImagePreview(null)
        }}
      >
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 text-white rounded-xl max-w-4xl max-h-[90vh] p-3">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <ImageIconLucide className="w-4 h-4 text-purple-400" />
              Скриншот операции
            </DialogTitle>
          </DialogHeader>

          {selectedImagePreview && (
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={selectedImagePreview || "/placeholder.svg"}
                alt="Trade Screenshot"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
