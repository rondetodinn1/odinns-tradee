import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency with abbreviation for large numbers
export function formatCurrency(value: number, abbreviate = false, decimals = 2): string {
  if (abbreviate && value >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`
  } else if (abbreviate && value >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`
  } else if (abbreviate && value >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Format number with commas
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

// Format time ago
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + " years ago"
  }

  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + " months ago"
  }

  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + " days ago"
  }

  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + " hours ago"
  }

  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago"
  }

  return Math.floor(seconds) + " seconds ago"
}
