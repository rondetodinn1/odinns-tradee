import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Используем DuckDuckGo Instant Answer API (бесплатный)
    const searchResults = await Promise.allSettled([
      // DuckDuckGo Instant Answer
      fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`)
        .then((res) => res.json())
        .then((data) => ({
          source: "DuckDuckGo",
          abstract: data.Abstract,
          abstractText: data.AbstractText,
          abstractURL: data.AbstractURL,
          relatedTopics: data.RelatedTopics?.slice(0, 3) || [],
        }))
        .catch(() => null),

      // Wikipedia API
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g, "_"))}`)
        .then((res) => res.json())
        .then((data) => ({
          source: "Wikipedia",
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page,
        }))
        .catch(() => null),

      // News API (можно заменить на другой источник)
      fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=3&apiKey=demo`)
        .then((res) => res.json())
        .then((data) => ({
          source: "News",
          articles: data.articles?.slice(0, 3) || [],
        }))
        .catch(() => null),
    ])

    const results = searchResults.map((result) => (result.status === "fulfilled" ? result.value : null)).filter(Boolean)

    return NextResponse.json({
      query,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Web search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
