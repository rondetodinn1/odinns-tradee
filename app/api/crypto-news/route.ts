import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    console.log("🔄 Fetching real cryptocurrency news...")

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Try multiple real news APIs in sequence until we get data
    const newsData = await fetchRealCryptoNews(limit)

    console.log(`✅ Retrieved ${newsData.length} cryptocurrency news articles`)

    return NextResponse.json({
      success: true,
      data: {
        articles: newsData,
        total: newsData.length,
        sources: newsData.length > 0 ? 1 : 0,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error fetching cryptocurrency news:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cryptocurrency news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function fetchRealCryptoNews(limit: number): Promise<any[]> {
  // Try CryptoCompare News API
  try {
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,Bitcoin,Crypto&excludeCategories=Sponsored&sortOrder=popular&limit=${limit}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoDashboard/1.0)",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.Data && Array.isArray(data.Data)) {
      return data.Data.map((article: any) => ({
        id: article.id || String(article.published_on),
        title: article.title,
        summary: article.body?.substring(0, 200) + "..." || article.title,
        url: article.url,
        source: article.source || "CryptoCompare",
        publishedAt: new Date(article.published_on * 1000).toISOString(),
        sentiment: determineSentiment(article.title, article.body || ""),
        impact: determineImpact(article.title, article.categories),
        imageUrl: article.imageurl || null,
        categories: article.categories,
        tags: article.tags,
      }))
    }
    throw new Error("No data returned from CryptoCompare")
  } catch (cryptoCompareError) {
    console.error("CryptoCompare API error:", cryptoCompareError)

    // Try Coinpaprika News API
    try {
      const response = await fetch("https://api.coinpaprika.com/v1/coins/btc-bitcoin/events", {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoDashboard/1.0)",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Coinpaprika API error: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        return data.slice(0, limit).map((event: any) => ({
          id: event.id || String(new Date(event.date_to || event.date).getTime()),
          title: event.name,
          summary: event.description?.substring(0, 200) + "..." || event.name,
          url: event.link || "#",
          source: "Coinpaprika",
          publishedAt: new Date(event.date_to || event.date).toISOString(),
          sentiment: determineSentiment(event.name, event.description || ""),
          impact: determineImpact(event.name, []),
          imageUrl: null,
        }))
      }
      throw new Error("No data returned from Coinpaprika")
    } catch (coinpaprikaError) {
      console.error("Coinpaprika API error:", coinpaprikaError)

      // Try CoinGecko Status Updates as last resort
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/status_updates?category=general&project_type=coin&per_page=10",
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; CryptoDashboard/1.0)",
            },
            cache: "no-store",
          },
        )

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status_updates && Array.isArray(data.status_updates)) {
          return data.status_updates.slice(0, limit).map((update: any) => ({
            id: update.id || String(new Date(update.created_at).getTime()),
            title: update.description?.substring(0, 60) + "..." || "Cryptocurrency Update",
            summary: update.description?.substring(0, 200) + "..." || "No description available",
            url: update.project?.links?.homepage?.[0] || "#",
            source: update.user || "CoinGecko",
            publishedAt: update.created_at,
            sentiment: determineSentiment(update.description || "", ""),
            impact: "medium",
            imageUrl: update.project?.image?.small || null,
          }))
        }
        throw new Error("No data returned from CoinGecko")
      } catch (coingeckoError) {
        console.error("CoinGecko API error:", coingeckoError)
        // If all APIs fail, return empty array
        return []
      }
    }
  }
}

function determineSentiment(title: string, body: string): "positive" | "negative" | "neutral" {
  const text = (title + " " + body).toLowerCase()

  const positiveTerms = [
    "bull",
    "bullish",
    "surge",
    "soar",
    "rally",
    "gain",
    "jump",
    "rise",
    "high",
    "growth",
    "positive",
    "optimistic",
    "adoption",
    "support",
    "breakthrough",
    "milestone",
    "success",
  ]

  const negativeTerms = [
    "bear",
    "bearish",
    "crash",
    "plunge",
    "drop",
    "fall",
    "decline",
    "low",
    "loss",
    "concern",
    "negative",
    "pessimistic",
    "ban",
    "regulation",
    "hack",
    "scam",
    "fraud",
    "risk",
    "warning",
  ]

  let positiveCount = 0
  let negativeCount = 0

  positiveTerms.forEach((term) => {
    if (text.includes(term)) positiveCount++
  })

  negativeTerms.forEach((term) => {
    if (text.includes(term)) negativeCount++
  })

  if (positiveCount > negativeCount) return "positive"
  if (negativeCount > positiveCount) return "negative"
  return "neutral"
}

function determineImpact(title: string, categories: string[]): "high" | "medium" | "low" {
  const text = title.toLowerCase()
  const highImpactTerms = [
    "major",
    "significant",
    "massive",
    "huge",
    "critical",
    "important",
    "breaking",
    "regulation",
    "ban",
    "approval",
    "etf",
    "fed",
    "government",
    "law",
    "sec",
  ]

  const mediumImpactTerms = [
    "partnership",
    "update",
    "launch",
    "release",
    "announce",
    "development",
    "integration",
    "adoption",
    "milestone",
  ]

  for (const term of highImpactTerms) {
    if (text.includes(term)) return "high"
  }

  for (const term of mediumImpactTerms) {
    if (text.includes(term)) return "medium"
  }

  // Check categories if available
  if (Array.isArray(categories)) {
    const highImpactCategories = ["Regulation", "Government", "Exchange", "Mining", "ETF", "Institutional"]
    for (const category of categories) {
      if (highImpactCategories.some((c) => category.includes(c))) {
        return "high"
      }
    }
  }

  return "low"
}

export const dynamic = "force-dynamic"
export const revalidate = 0
