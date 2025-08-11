import { createClient } from "@supabase/supabase-js"

// Конфигурация Supabase
const supabaseUrl = "https://aoggmbknngyvtdclnxtf.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2dtYmtubmd5dnRkY2xueHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzM4NjUsImV4cCI6MjA2NTQwOTg2NX0.5a0nlahPlrTaTf6GCOiAJfFy5LG7DMuV6cmXsHILves"

// Создание клиента Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Отключаем автоматическое сохранение сессии
    autoRefreshToken: false,
  },
})

// Экспорт функции для получения клиента (для совместимости)
export const getSupabaseClient = () => supabase

// Типы для базы данных
export interface User {
  id: string
  username: string
  password_hash: string
  email?: string
  full_name?: string
  avatar_url?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CryptoJournalEntry {
  id: string
  user_id: string
  cryptocurrency: string
  entry_point: number
  exit_point?: number
  quantity?: number
  details?: string
  profit_loss?: number
  screenshot_url?: string
  trade_type: "buy" | "sell"
  status: "open" | "closed"
  created_at: string
  updated_at: string
}

export interface BalanceEntry {
  id: string
  user_id: string
  amount: number
  type: "deposit" | "withdrawal" | "trade_profit" | "trade_loss" | "income" | "expense"
  category: string
  description?: string
  created_at: string
}

export interface ActivityMessage {
  id: string
  user_id: string
  message: string
  type: "info" | "warning" | "success" | "error"
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  is_read: boolean
  created_at: string
}
