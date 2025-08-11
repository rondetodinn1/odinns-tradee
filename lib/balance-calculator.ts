export interface BalanceEntry {
  id: string
  user_id: string
  type: "trade_profit" | "trade_loss" | "deposit" | "withdrawal" | "expense" | "income"
  amount: number
  description: string
  category?: string
  created_at: string
}

export interface TradeEntry {
  id: string
  user_id: string
  trade_type: string
  profit_loss: number
  status?: string
  created_at: string
}

export class BalanceCalculator {
  // ОБЩИЙ БАЛАНС (все операции включая торговлю)
  static calculateTotalBalance(balanceEntries: BalanceEntry[], tradeEntries: TradeEntry[] = []): number {
    let total = 0

    // Добавляем баланс из balance_entries
    total += balanceEntries.reduce((sum, entry) => {
      switch (entry.type) {
        case "deposit":
        case "income":
          return sum + entry.amount
        case "withdrawal":
        case "expense":
          return sum - Math.abs(entry.amount)
        default:
          return sum
      }
    }, 0)

    // Добавляем ТОЛЬКО торговлю из crypto_journal
    total += tradeEntries
      .filter((entry) => entry.trade_type === "trade")
      .reduce((sum, entry) => sum + (entry.profit_loss || 0), 0)

    return total
  }

  // ТОЛЬКО ТОРГОВАЯ СТАТИСТИКА (ТОЛЬКО trade_type === "trade")
  static getTradingStats(tradeEntries: TradeEntry[]) {
    const tradingEntries = tradeEntries.filter((entry) => entry.trade_type === "trade")

    const totalPnL = tradingEntries.reduce((sum, entry) => sum + (entry.profit_loss || 0), 0)
    const totalTrades = tradingEntries.length
    const profitableTrades = tradingEntries.filter((entry) => (entry.profit_loss || 0) > 0)
    const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0
    const bestTrade = tradingEntries.length > 0 ? Math.max(...tradingEntries.map((entry) => entry.profit_loss || 0)) : 0
    const worstTrade =
      tradingEntries.length > 0 ? Math.min(...tradingEntries.map((entry) => entry.profit_loss || 0)) : 0

    return {
      totalPnL,
      totalTrades,
      winRate,
      bestTrade,
      worstTrade,
      profitableTrades: profitableTrades.length,
      losingTrades: totalTrades - profitableTrades.length,
    }
  }

  // ДЕПОЗИТЫ (не торговля)
  static getTotalDeposits(entries: BalanceEntry[]): number {
    return entries.filter((entry) => entry.type === "deposit").reduce((total, entry) => total + entry.amount, 0)
  }

  // ВЫВОДЫ (не торговля)
  static getTotalWithdrawals(entries: BalanceEntry[]): number {
    return entries
      .filter((entry) => entry.type === "withdrawal")
      .reduce((total, entry) => total + Math.abs(entry.amount), 0)
  }

  // РАСХОДЫ (не торговля)
  static getTotalExpenses(entries: BalanceEntry[]): number {
    return entries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + Math.abs(entry.amount), 0)
  }

  // ДОХОДЫ (не торговля)
  static getTotalIncome(entries: BalanceEntry[]): number {
    return entries.filter((entry) => entry.type === "income").reduce((total, entry) => total + entry.amount, 0)
  }
}
