// Currency helpers using Google Finance (via /api/usd-uah) with local cache and optional manual override.
// getUSDToUAHRate(): returns a NUMBER for backward-compatibility.
// getExchangeRateInfo(): returns a detailed object for richer UIs (TradingStatistics).

const CACHE_KEY = "usd_uah_rate_cache_v3"
const OVERRIDE_KEY = "usd_uah_rate_override_v1"
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export type ExchangeRateInfo = {
  rate: number
  updatedAt: string
  fromOverride: boolean
  source: "Google" | "Fallback" | "Override"
}

function round2(x: unknown): number {
  const n = Number(x)
  if (!Number.isFinite(n) || n <= 0) return 41.5
  return Math.round(n * 100) / 100
}

export function convertUSDToUAH(amount: number, rate: number): number {
  const n = Number(amount)
  const r = Number(rate)
  if (!Number.isFinite(n) || !Number.isFinite(r)) return 0
  return n * r
}

export function formatUAH(value: number): string {
  const v = Number(value)
  if (!Number.isFinite(v)) return "₴0.00"
  try {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      maximumFractionDigits: 2,
    }).format(v)
  } catch {
    return `${v.toFixed(2)} ₴`
  }
}

// Manual override controls (client-only)
export function setRateOverride(v: number) {
  if (typeof window === "undefined") return
  const n = round2(v)
  if (Number.isFinite(n) && n > 0) {
    window.localStorage.setItem(OVERRIDE_KEY, String(n))
  }
}

export function getRateOverride(): number | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(OVERRIDE_KEY)
  if (!raw) return null
  const n = round2(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function clearRateOverride() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(OVERRIDE_KEY)
}

/**
 * Returns USD→UAH as NUMBER (2 decimals).
 * - Respects manual override if present.
 * - Uses cached Google result if fresh (10 min).
 * - Falls back safely.
 */
export async function getUSDToUAHRate(forceRefresh = false): Promise<number> {
  // Manual override wins
  const override = getRateOverride()
  if (override) return override

  // Try cache first
  if (typeof window !== "undefined" && !forceRefresh) {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw) {
      try {
        const cached = JSON.parse(raw) as {
          rate?: unknown
          updatedAt?: string
          source?: string
          cachedAt?: number
        }
        const rate = round2(cached?.rate)
        const fresh = Date.now() - Number(cached?.cachedAt) < CACHE_TTL_MS
        if (fresh && rate > 0) {
          return rate
        }
      } catch {
        // ignore bad cache
      }
    }
  }

  // Fetch from our server route (Google Finance)
  let rate = 41.5
  try {
    const res = await fetch("/api/usd-uah", { cache: "no-store" })
    if (res.ok) {
      const data = (await res.json()) as {
        rate?: unknown
        updatedAt?: string
        source?: string
      }
      rate = round2(data?.rate)

      // Save cache
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            rate,
            updatedAt: data?.updatedAt || new Date().toISOString(),
            source: data?.source || "Google",
            cachedAt: Date.now(),
          }),
        )
      }
      return rate
    }
  } catch {
    // ignore and try stale cache
  }

  // Try stale cache
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw) {
      try {
        const cached = JSON.parse(raw) as { rate?: unknown }
        const parsed = round2(cached?.rate)
        if (parsed > 0) return parsed
      } catch {
        // ignore
      }
    }
  }

  return rate
}

/**
 * Detailed info for UIs that need timestamp/source/override flag.
 * Keeps compatibility with getUSDToUAHRate NUMBER return.
 */
export async function getExchangeRateInfo(forceRefresh = false): Promise<ExchangeRateInfo> {
  // Manual override
  const override = getRateOverride()
  if (override) {
    return {
      rate: round2(override),
      updatedAt: new Date().toISOString(),
      fromOverride: true,
      source: "Override",
    }
  }

  // Try cache if not forced
  if (typeof window !== "undefined" && !forceRefresh) {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw) {
      try {
        const cached = JSON.parse(raw) as {
          rate?: unknown
          updatedAt?: string
          source?: "Google" | "Fallback"
          cachedAt?: number
        }
        const rate = round2(cached?.rate)
        const fresh = Date.now() - Number(cached?.cachedAt) < CACHE_TTL_MS
        if (fresh && rate > 0) {
          return {
            rate,
            updatedAt: cached?.updatedAt || new Date().toISOString(),
            fromOverride: false,
            source: cached?.source || "Google",
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // Fetch fresh
  try {
    const res = await fetch("/api/usd-uah", { cache: "no-store" })
    if (res.ok) {
      const data = (await res.json()) as {
        rate?: unknown
        updatedAt?: string
        source?: "Google" | "Fallback"
      }
      const rate = round2(data?.rate)
      const updatedAt = data?.updatedAt || new Date().toISOString()
      const source = data?.source || "Google"

      // Save cache
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            rate,
            updatedAt,
            source,
            cachedAt: Date.now(),
          }),
        )
      }

      return {
        rate,
        updatedAt,
        fromOverride: false,
        source,
      }
    }
  } catch {
    // ignore
  }

  // Try stale cache
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw) {
      try {
        const cached = JSON.parse(raw) as {
          rate?: unknown
          updatedAt?: string
          source?: "Google" | "Fallback"
        }
        const rate = round2(cached?.rate)
        if (rate > 0) {
          return {
            rate,
            updatedAt: cached?.updatedAt || new Date().toISOString(),
            fromOverride: false,
            source: cached?.source || "Fallback",
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // Final fallback
  return {
    rate: 41.5,
    updatedAt: new Date().toISOString(),
    fromOverride: false,
    source: "Fallback",
  }
}
