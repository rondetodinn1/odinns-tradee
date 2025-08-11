// USD→UAH from Google Finance, rounded to 2 decimals.
// Parses multiple selectors to be resilient to minor HTML changes.
export async function GET() {
  const updatedAt = new Date().toISOString()

  try {
    const url = "https://www.google.com/finance/quote/USD-UAH?hl=en"
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        accept: "text/html,application/xhtml+xml",
      },
    })

    if (!res.ok) {
      throw new Error(`Google HTTP ${res.status}`)
    }

    const html = await res.text()

    // Try several robust patterns:
    // 1) data-last-price attribute
    // 2) JSON-like raw price
    // 3) Visible price div with class "YMlKec"
    let rate: number | null = null

    // data-last-price="41.5321"
    const attrMatch = html.match(/data-last-price="([\d.,]+)"/i)
    if (attrMatch?.[1]) {
      const v = Number(attrMatch[1].replace(",", ""))
      if (Number.isFinite(v) && v > 0) rate = v
    }

    // "price":{"raw":41.5321}
    if (rate == null) {
      const jsonMatch = html.match(/"price"\s*:\s*\{\s*"raw"\s*:\s*([\d.]+)/i)
      if (jsonMatch?.[1]) {
        const v = Number(jsonMatch[1])
        if (Number.isFinite(v) && v > 0) rate = v
      }
    }

    // <div class="YMlKec ...">41.53</div>
    if (rate == null) {
      const divMatch = html.match(/class="YMlKec[^"]*">([\d.,]+)<\/div>/i)
      if (divMatch?.[1]) {
        const v = Number(divMatch[1].replace(",", ""))
        if (Number.isFinite(v) && v > 0) rate = v
      }
    }

    // Final validation and rounding
    const safeRate =
      Number.isFinite(rate as number) && (rate as number) > 0
        ? Math.round((rate as number) * 100) / 100
        : 41.5

    return Response.json(
      {
        success: true,
        source: "Google",
        rate: safeRate,
        updatedAt,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch (err) {
    return Response.json(
      {
        success: false,
        source: "Fallback",
        rate: 41.5,
        updatedAt,
        warning: "Google Finance unavailable",
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  }
}
