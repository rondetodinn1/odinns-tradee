// Enhanced Crypto API - Built-in for ODINNS Platform
// Handles multiple exchanges and real-time data

export interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap?: number
  high24h: number
  low24h: number
  timestamp: number
}

export interface CandlestickData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OrderBookData {
  bids: [number, number][] // [price, quantity]
  asks: [number, number][]
  timestamp: number
}

export interface MarketStats {
  totalMarketCap: number
  totalVolume24h: number
  btcDominance: number
  activeCoins: number
  marketCapChange24h: number
}

export class EnhancedCryptoAPI {
  private static readonly COINGECKO_BASE = "https://api.coingecko.com/api/v3"
  private static readonly BINANCE_BASE = "https://api.binance.com/api/v3"

  // Get current price for a symbol
  static async getCurrentPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      // Try multiple sources for reliability
      const sources = [() => this.getBinancePrice(symbol), () => this.getCoinGeckoPrice(symbol)]

      for (const source of sources) {
        try {
          const result = await source()
          if (result) return result
        } catch (error) {
          console.warn(`Price source failed:`, error)
          continue
        }
      }

      return null
    } catch (error) {
      console.error("Error fetching current price:", error)
      return null
    }
  }

  // Get historical candlestick data
  static async getCandlestickData(
    symbol: string,
    interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" = "1h",
    limit = 100,
  ): Promise<CandlestickData[]> {
    try {
      // Try Binance first (most reliable)
      const binanceData = await this.getBinanceCandlesticks(symbol, interval, limit)
      if (binanceData.length > 0) return binanceData

      // Generate mock data if APIs fail
      return this.generateMockCandlesticks(symbol, limit)
    } catch (error) {
      console.error("Error fetching candlestick data:", error)
      return this.generateMockCandlesticks(symbol, limit)
    }
  }

  // Get market statistics
  static async getMarketStats(): Promise<MarketStats> {
    try {
      const response = await fetch(`${this.COINGECKO_BASE}/global`)
      const data = await response.json()

      return {
        totalMarketCap: data.data.total_market_cap.usd || 2500000000000,
        totalVolume24h: data.data.total_volume.usd || 100000000000,
        btcDominance: data.data.market_cap_percentage.btc || 45,
        activeCoins: data.data.active_cryptocurrencies || 10000,
        marketCapChange24h: data.data.market_cap_change_percentage_24h_usd || 0,
      }
    } catch (error) {
      console.error("Error fetching market stats:", error)
      // Return mock data
      return {
        totalMarketCap: 2500000000000,
        totalVolume24h: 100000000000,
        btcDominance: 45.2,
        activeCoins: 10000,
        marketCapChange24h: 2.1,
      }
    }
  }

  // Get top cryptocurrencies
  static async getTopCryptos(limit = 10): Promise<CryptoPrice[]> {
    try {
      const response = await fetch(
        `${this.COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
      )
      const data = await response.json()

      return data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_24h || 0,
        changePercent24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap,
        high24h: coin.high_24h || coin.current_price,
        low24h: coin.low_24h || coin.current_price,
        timestamp: Date.now(),
      }))
    } catch (error) {
      console.error("Error fetching top cryptos:", error)
      return this.getMockTopCryptos(limit)
    }
  }

  // Private methods for different exchanges
  private static async getBinancePrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      const binanceSymbol = symbol.replace("/", "").toUpperCase()
      const response = await fetch(`${this.BINANCE_BASE}/ticker/24hr?symbol=${binanceSymbol}USDT`)
      const data = await response.json()

      if (data.code) return null // Error response

      return {
        symbol: symbol.toUpperCase(),
        price: Number.parseFloat(data.lastPrice),
        change24h: Number.parseFloat(data.priceChange),
        changePercent24h: Number.parseFloat(data.priceChangePercent),
        volume24h: Number.parseFloat(data.volume),
        high24h: Number.parseFloat(data.highPrice),
        low24h: Number.parseFloat(data.lowPrice),
        timestamp: Date.now(),
      }
    } catch (error) {
      return null
    }
  }

  private static async getCoinGeckoPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      const coinId = this.getCoinGeckoId(symbol)
      const response = await fetch(
        `${this.COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
      )
      const data = await response.json()

      if (!data[coinId]) return null

      const coinData = data[coinId]
      return {
        symbol: symbol.toUpperCase(),
        price: coinData.usd,
        change24h: 0, // CoinGecko doesn't provide absolute change
        changePercent24h: coinData.usd_24h_change || 0,
        volume24h: coinData.usd_24h_vol || 0,
        high24h: coinData.usd * 1.05, // Estimate
        low24h: coinData.usd * 0.95, // Estimate
        timestamp: Date.now(),
      }
    } catch (error) {
      return null
    }
  }

  private static async getBinanceCandlesticks(
    symbol: string,
    interval: string,
    limit: number,
  ): Promise<CandlestickData[]> {
    try {
      const binanceSymbol = symbol.replace("/", "").toUpperCase()
      const response = await fetch(
        `${this.BINANCE_BASE}/klines?symbol=${binanceSymbol}USDT&interval=${interval}&limit=${limit}`,
      )
      const data = await response.json()

      if (!Array.isArray(data)) return []

      return data.map((candle: any[]) => ({
        timestamp: candle[0],
        open: Number.parseFloat(candle[1]),
        high: Number.parseFloat(candle[2]),
        low: Number.parseFloat(candle[3]),
        close: Number.parseFloat(candle[4]),
        volume: Number.parseFloat(candle[5]),
      }))
    } catch (error) {
      return []
    }
  }

  // Utility methods
  private static getCoinGeckoId(symbol: string): string {
    const mapping: { [key: string]: string } = {
      BTC: "bitcoin",
      ETH: "ethereum",
      BNB: "binancecoin",
      ADA: "cardano",
      SOL: "solana",
      XRP: "ripple",
      DOT: "polkadot",
      DOGE: "dogecoin",
      AVAX: "avalanche-2",
      SHIB: "shiba-inu",
      MATIC: "matic-network",
      LTC: "litecoin",
      UNI: "uniswap",
      LINK: "chainlink",
      ATOM: "cosmos",
    }

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase()
  }

  private static generateMockCandlesticks(symbol: string, limit: number): CandlestickData[] {
    const data: CandlestickData[] = []
    let basePrice = this.getBasePriceForSymbol(symbol)
    const now = Date.now()

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - i * 60 * 60 * 1000 // 1 hour intervals
      const volatility = 0.02 // 2% volatility

      const open = basePrice
      const change = (Math.random() - 0.5) * 2 * volatility
      const close = open * (1 + change)
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
      const volume = Math.random() * 1000000

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      })

      basePrice = close
    }

    return data
  }

  private static getBasePriceForSymbol(symbol: string): number {
    const prices: { [key: string]: number } = {
      BTC: 45000,
      ETH: 2500,
      BNB: 300,
      ADA: 0.5,
      SOL: 100,
      XRP: 0.6,
      DOT: 7,
      DOGE: 0.08,
      AVAX: 25,
      SHIB: 0.000025,
      MATIC: 0.8,
      LTC: 70,
      UNI: 6,
      LINK: 15,
      ATOM: 12,
    }

    return prices[symbol.toUpperCase()] || 1
  }

  private static getMockTopCryptos(limit: number): CryptoPrice[] {
    const cryptos = [
      { symbol: "BTC", price: 45000, change: 2.5 },
      { symbol: "ETH", price: 2500, change: -1.2 },
      { symbol: "BNB", price: 300, change: 3.1 },
      { symbol: "ADA", price: 0.5, change: 1.8 },
      { symbol: "SOL", price: 100, change: -2.3 },
      { symbol: "XRP", price: 0.6, change: 0.9 },
      { symbol: "DOT", price: 7, change: 1.5 },
      { symbol: "DOGE", price: 0.08, change: 4.2 },
      { symbol: "AVAX", price: 25, change: -0.8 },
      { symbol: "SHIB", price: 0.000025, change: 6.7 },
    ]

    return cryptos.slice(0, limit).map((crypto) => ({
      symbol: crypto.symbol,
      price: crypto.price,
      change24h: crypto.price * (crypto.change / 100),
      changePercent24h: crypto.change,
      volume24h: Math.random() * 1000000000,
      marketCap: crypto.price * Math.random() * 1000000000,
      high24h: crypto.price * 1.05,
      low24h: crypto.price * 0.95,
      timestamp: Date.now(),
    }))
  }

  // Real-time price updates (WebSocket simulation)
  static subscribeToPrice(symbol: string, callback: (price: CryptoPrice) => void): () => void {
    const interval = setInterval(async () => {
      const price = await this.getCurrentPrice(symbol)
      if (price) {
        callback(price)
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }

  // Portfolio tracking
  static async calculatePortfolioValue(holdings: { symbol: string; amount: number }[]): Promise<number> {
    let totalValue = 0

    for (const holding of holdings) {
      const price = await this.getCurrentPrice(holding.symbol)
      if (price) {
        totalValue += price.price * holding.amount
      }
    }

    return totalValue
  }
}

// Export for easy use
export const CryptoAPI = EnhancedCryptoAPI
