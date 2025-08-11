import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Используем CoinGecko API без ключа (бесплатный) с ограниченным количеством запросов
    const cryptoIds = [
      "bitcoin",
      "ethereum",
      "binancecoin",
      "solana",
      "avalanche-2",
      "dogwifcoin",
      "popcat",
      "pepe",
      "uniswap",
      "ai16z",
    ]

    console.log("📊 Запрос рыночных данных...")

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "ODINNS-Trading-Platform/1.0",
          },
          // Добавляем timeout
          signal: AbortSignal.timeout(10000),
          next: { revalidate: 60 }, // Cache for 60 seconds instead of 30
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Получены реальные рыночные данные")

        // Transform data to our format
        const marketData: any = {}
        let totalVolume = 0

        Object.entries(data).forEach(([id, info]: [string, any]) => {
          const cryptoName = getCryptoName(id)
          marketData[cryptoName] = {
            price: info.usd,
            change24h: info.usd_24h_change || 0,
            volume24h: info.usd_24h_vol || 0,
            marketCap: info.usd_market_cap || 0,
          }
          totalVolume += marketData[cryptoName].volume24h
        })

        marketData.totalVolume = totalVolume

        return NextResponse.json({
          success: true,
          data: marketData,
          timestamp: new Date().toISOString(),
          source: "CoinGecko API (Real-time)",
        })
      } else if (response.status === 429) {
        console.warn("⚠️ CoinGecko API rate limit exceeded, используем fallback данные")
      } else {
        console.warn(`⚠️ CoinGecko API error: ${response.status}, используем fallback данные`)
      }
    } catch (apiError) {
      console.warn("⚠️ CoinGecko API недоступен, используем fallback данные")
    }

    // Fallback: используем реалистичные mock данные
    console.log("📦 Используем fallback рыночные данные")

    return NextResponse.json({
      success: true,
      data: getRealisticMockData(),
      timestamp: new Date().toISOString(),
      source: "Fallback Data (Realistic)",
    })
  } catch (error) {
    console.error("❌ Market data fetch error:", error)

    // В случае любой ошибки возвращаем fallback данные
    return NextResponse.json({
      success: true,
      data: getRealisticMockData(),
      timestamp: new Date().toISOString(),
      source: "Emergency Fallback",
    })
  }
}

function getRealisticMockData() {
  // Более реалистичные текущие цены с небольшими колебаниями
  const baseTime = Date.now()
  const randomFactor = () => (Math.random() - 0.5) * 0.1 // ±5% колебания

  return {
    bitcoin: {
      price: Math.round(103000 * (1 + randomFactor())),
      change24h: -0.5 + (Math.random() - 0.5) * 6, // ±3% от базового значения
      volume24h: Math.round(28000000000 * (1 + randomFactor())),
      marketCap: 2000000000000,
    },
    ethereum: {
      price: Math.round(3800 * (1 + randomFactor())),
      change24h: 1.2 + (Math.random() - 0.5) * 4,
      volume24h: Math.round(15000000000 * (1 + randomFactor())),
      marketCap: 450000000000,
    },
    binancecoin: {
      price: Math.round(690 * (1 + randomFactor())),
      change24h: 0.8 + (Math.random() - 0.5) * 3,
      volume24h: Math.round(1800000000 * (1 + randomFactor())),
      marketCap: 100000000000,
    },
    solana: {
      price: Math.round(240 * (1 + randomFactor())),
      change24h: 3.4 + (Math.random() - 0.5) * 4,
      volume24h: Math.round(3200000000 * (1 + randomFactor())),
      marketCap: 65000000000,
    },
    avalanche: {
      price: Math.round(42 * (1 + randomFactor() * 0.5)),
      change24h: -0.5 + (Math.random() - 0.5) * 2,
      volume24h: Math.round(850000000 * (1 + randomFactor())),
      marketCap: 10000000000,
    },
    dogwifcoin: {
      price: Number.parseFloat((1.85 * (1 + randomFactor())).toFixed(4)),
      change24h: 5.2 + (Math.random() - 0.5) * 4,
      volume24h: Math.round(125000000 * (1 + randomFactor())),
      marketCap: 2000000000,
    },
    popcat: {
      price: Number.parseFloat((0.85 * (1 + randomFactor())).toFixed(4)),
      change24h: -2.1 + (Math.random() - 0.5) * 2,
      volume24h: Math.round(45000000 * (1 + randomFactor())),
      marketCap: 800000000,
    },
    pepe: {
      price: Number.parseFloat((0.000018 * (1 + randomFactor())).toFixed(8)),
      change24h: 8.7 + (Math.random() - 0.5) * 6,
      volume24h: Math.round(890000000 * (1 + randomFactor())),
      marketCap: 7000000000,
    },
    uniswap: {
      price: Number.parseFloat((12.5 * (1 + randomFactor())).toFixed(2)),
      change24h: 1.9 + (Math.random() - 0.5) * 3,
      volume24h: Math.round(320000000 * (1 + randomFactor())),
      marketCap: 9000000000,
    },
    ai16z: {
      price: Number.parseFloat((0.75 * (1 + randomFactor())).toFixed(4)),
      change24h: 12.3 + (Math.random() - 0.5) * 8,
      volume24h: Math.round(67000000 * (1 + randomFactor())),
      marketCap: 500000000,
    },
    totalVolume: Math.round(85000000000 * (1 + randomFactor())),
  }
}

function getCryptoName(id: string): string {
  const mapping: { [key: string]: string } = {
    bitcoin: "bitcoin",
    ethereum: "ethereum",
    binancecoin: "binancecoin",
    solana: "solana",
    "avalanche-2": "avalanche",
    dogwifcoin: "dogwifcoin",
    popcat: "popcat",
    pepe: "pepe",
    uniswap: "uniswap",
    ai16z: "ai16z",
  }
  return mapping[id] || id
}
