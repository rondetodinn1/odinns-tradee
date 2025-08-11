import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function verifyGlobalPassword(password: string): Promise<boolean> {
  try {
    console.log("=== VERIFYING GLOBAL PASSWORD FROM DB ===")

    const response = await fetch("/api/verify-global-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    })

    const result = await response.json()
    console.log("Global password verification result:", result.success)

    return result.success
  } catch (error) {
    console.error("Global password verification error:", error)
    return false
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    console.log("Authenticating user:", username)

    // Поиск пользователя в базе данных
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Database error:", error)
      return null
    }

    if (!user) {
      console.log("User not found:", username)
      return null
    }

    // Проверка пароля (в реальном приложении пароли должны быть захешированы)
    if (user.password_hash !== password) {
      console.log("Invalid password for user:", username)
      return null
    }

    console.log("Authentication successful for user:", username, {
      hasAvatar: !!user.avatar_url,
      avatarLength: user.avatar_url?.length || 0,
    })

    // Обновляем статус пользователя на дефолтный статус
    await updateUserStatus(user.id, "Отдыхаю")

    return user
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  try {
    console.log("=== UPDATING USER AVATAR ===")
    console.log("User ID:", userId)
    console.log("Avatar URL length:", avatarUrl.length)
    console.log("Avatar URL preview:", avatarUrl.substring(0, 50) + "...")

    const { data, error } = await supabase
      .from("users")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, username, avatar_url, updated_at")

    if (error) {
      console.error("❌ Avatar update error:", error)
      return false
    }

    console.log("✅ Avatar updated successfully:", data)
    return true
  } catch (error) {
    console.error("❌ Avatar update exception:", error)
    return false
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log("=== FETCHING USER BY ID ===")
    console.log("User ID:", userId)

    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ Get user error:", error)
      return null
    }

    console.log("✅ User fetched:", {
      username: user.username,
      hasAvatar: !!user.avatar_url,
      avatarLength: user.avatar_url?.length || 0,
    })

    return user
  } catch (error) {
    console.error("❌ Get user exception:", error)
    return null
  }
}

export async function updateUserStatus(userId: string, status: string): Promise<boolean> {
  try {
    // ВАЛИДАЦИЯ - НЕ ДОПУСКАЕМ "online"
    const validStatuses = ["Сплю", "Отдыхаю", "Наблюдаю за рынком", "Торгую в сделке", "Гуляю", "Играю"]
    const finalStatus = validStatuses.includes(status) ? status : "Отдыхаю"

    const { error } = await supabase.from("user_status").upsert(
      {
        user_id: userId,
        status: finalStatus,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (error) {
      console.error("Status update error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Status update exception:", error)
    return false
  }
}

export async function getUserStats(userId: string) {
  try {
    console.log("=== GETTING USER STATS ===")
    console.log("User ID:", userId)

    // ТОЛЬКО ТОРГОВЛЯ (trade_type === "trade")
    const { data: trades } = await supabase
      .from("crypto_journal")
      .select("profit_loss, trade_type, status, created_at")
      .eq("user_id", userId)
      .eq("trade_type", "trade") // ТОЛЬКО ТОРГОВЛЯ!

    console.log("Trading entries found:", trades?.length || 0)

    if (!trades || trades.length === 0) {
      return {
        totalPnL: 0,
        totalTrades: 0,
        winRate: 0,
        bestTrade: 0,
        openTrades: 0,
        closedTrades: 0,
        todayPnL: 0,
      }
    }

    const totalPnL = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)
    const totalTrades = trades.length
    const winningTrades = trades.filter((trade) => (trade.profit_loss || 0) > 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const bestTrade = Math.max(...trades.map((trade) => trade.profit_loss || 0), 0)
    const openTrades = trades.filter((trade) => trade.status === "open").length
    const closedTrades = trades.filter((trade) => trade.status === "closed").length

    // Сегодняшние сделки
    const today = new Date().toISOString().split("T")[0]
    const todayTrades = trades.filter((trade) => trade.created_at?.startsWith(today))
    const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)

    console.log("Stats calculated:", {
      totalPnL,
      totalTrades,
      winRate,
      bestTrade,
      openTrades,
      closedTrades,
      todayPnL,
    })

    return {
      totalPnL,
      totalTrades,
      winRate,
      bestTrade,
      openTrades,
      closedTrades,
      todayPnL,
    }
  } catch (error) {
    console.error("Stats error:", error)
    return {
      totalPnL: 0,
      totalTrades: 0,
      winRate: 0,
      bestTrade: 0,
      openTrades: 0,
      closedTrades: 0,
      todayPnL: 0,
    }
  }
}

export async function getUserBalance(userId: string): Promise<number> {
  try {
    console.log("=== CALCULATING USER BALANCE ===")
    console.log("User ID:", userId)

    // Получаем ВСЕ записи из crypto_journal
    const { data: allEntries, error } = await supabase
      .from("crypto_journal")
      .select("profit_loss, trade_type")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching entries:", error)
      return 0
    }

    console.log("All journal entries:", allEntries?.length || 0)

    if (!allEntries || allEntries.length === 0) {
      return 0
    }

    // ТОЛЬКО торговые операции влияют на P&L
    const tradingEntries = allEntries.filter((entry) => entry.trade_type === "trade")
    const tradingPnL = tradingEntries.reduce((sum, entry) => sum + (entry.profit_loss || 0), 0)

    // Операции баланса (депозиты, выводы и т.д.)
    const balanceEntries = allEntries.filter((entry) => entry.trade_type !== "trade")
    const balanceFromOperations = balanceEntries.reduce((sum, entry) => {
      const amount = entry.profit_loss || 0
      switch (entry.trade_type) {
        case "deposit":
        case "income":
          return sum + Math.abs(amount) // Всегда положительные
        case "withdrawal":
        case "expense":
          return sum - Math.abs(amount) // Всегда отрицательные
        default:
          return sum + amount
      }
    }, 0)

    const totalBalance = tradingPnL + balanceFromOperations

    console.log("Trading P&L:", tradingPnL)
    console.log("Balance from operations:", balanceFromOperations)
    console.log("Total balance:", totalBalance)

    return totalBalance
  } catch (error) {
    console.error("Balance calculation error:", error)
    return 0
  }
}

export async function addActivityMessage(
  userId: string,
  message: string,
  type: "info" | "warning" | "success" | "error" = "info",
) {
  try {
    // НЕ ЗАПИСЫВАЕМ АКТИВНОСТЬ С "online"
    if (message.includes("online")) {
      return false
    }

    const { error } = await supabase.from("activity_messages").insert({
      user_id: userId,
      message,
      type,
    })

    if (error) {
      console.error("Activity message error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Activity message exception:", error)
    return false
  }
}

export async function logoutUser(userId: string): Promise<boolean> {
  try {
    // Обновляем статус на offline
    await updateUserStatus(userId, "Отдыхаю")

    // Добавляем сообщение о выходе
    await addActivityMessage(userId, "Пользователь вышел из системы", "info")

    return true
  } catch (error) {
    console.error("Logout error:", error)
    return false
  }
}

export async function getTradingStats(userId: string) {
  try {
    console.log("=== GETTING TRADING STATS ===")

    // ТОЛЬКО торговые операции
    const { data: tradeEntries, error } = await supabase
      .from("crypto_journal")
      .select("profit_loss, trade_type, created_at")
      .eq("user_id", userId)
      .eq("trade_type", "trade") // ТОЛЬКО торговля!

    if (error) {
      console.error("Error fetching trading stats:", error)
      return {
        totalPnL: 0,
        todayPnL: 0,
        totalTrades: 0,
        winRate: 0,
        bestTrade: 0,
        worstTrade: 0,
      }
    }

    console.log("Trading entries found:", tradeEntries?.length || 0)

    const tradingEntries = tradeEntries || []
    const totalPnL = tradingEntries.reduce((sum, entry) => sum + (entry.profit_loss || 0), 0)

    // Сегодняшние сделки
    const today = new Date().toISOString().split("T")[0]
    const todayTrades = tradingEntries.filter((entry) => entry.created_at?.startsWith(today))
    const todayPnL = todayTrades.reduce((sum, entry) => sum + (entry.profit_loss || 0), 0)

    const totalTrades = tradingEntries.length
    const profitableTrades = tradingEntries.filter((entry) => (entry.profit_loss || 0) > 0)
    const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0

    const bestTrade = tradingEntries.length > 0 ? Math.max(...tradingEntries.map((e) => e.profit_loss || 0)) : 0
    const worstTrade = tradingEntries.length > 0 ? Math.min(...tradingEntries.map((e) => e.profit_loss || 0)) : 0

    console.log("Trading stats:", {
      totalPnL,
      todayPnL,
      totalTrades,
      winRate,
      bestTrade,
      worstTrade,
    })

    return {
      totalPnL,
      todayPnL,
      totalTrades,
      winRate,
      bestTrade,
      worstTrade,
    }
  } catch (error) {
    console.error("Error getting trading stats:", error)
    return {
      totalPnL: 0,
      todayPnL: 0,
      totalTrades: 0,
      winRate: 0,
      bestTrade: 0,
      worstTrade: 0,
    }
  }
}

export async function refreshUserFromDatabase(userId: string): Promise<User | null> {
  try {
    console.log("=== REFRESHING USER FROM DATABASE ===")
    console.log("User ID:", userId)

    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ Refresh user error:", error)
      return null
    }

    console.log("✅ User refreshed from database:", {
      username: user.username,
      hasAvatar: !!user.avatar_url,
      avatarLength: user.avatar_url?.length || 0,
    })

    // Обновляем localStorage
    const authData = localStorage.getItem("odinns_auth")
    if (authData) {
      const parsed = JSON.parse(authData)
      parsed.user = user
      localStorage.setItem("odinns_auth", JSON.stringify(parsed))
    }

    return user
  } catch (error) {
    console.error("❌ Refresh user exception:", error)
    return null
  }
}
