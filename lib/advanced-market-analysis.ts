export interface MarketDataPoint {
  time: number
  price: number
  volume?: number
}

export interface MarketData {
  symbol: string
  points: MarketDataPoint[]
}

export interface AdvancedIndicators {
  rsi: number
  macd: number
  emaTrend: "bullish" | "bearish" | "neutral"
}

export function computeAdvancedIndicators(data: MarketData): AdvancedIndicators {
  // Safe minimal mock computation to satisfy consumers without any external deps
  const last = data.points.at(-1)?.price ?? 0
  const prev = data.points.at(-2)?.price ?? last
  const change = last - prev

  // mock rsi/macd values
  const rsi = Math.max(0, Math.min(100, 50 + (change / (prev || 1)) * 100))
  const macd = change
  const emaTrend = change > 0 ? "bullish" : change < 0 ? "bearish" : "neutral"

  return { rsi, macd, emaTrend }
}
