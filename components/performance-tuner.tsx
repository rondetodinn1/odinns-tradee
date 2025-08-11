"use client"

import { useEffect } from "react"

/**
 * PerformanceTuner
 * - Adds 'mobile-perf' class on small screens or when user prefers reduced motion.
 * - We don't change logic; only hint CSS to tone down expensive effects on mobile.
 */
export function PerformanceTuner() {
  useEffect(() => {
    const root = document.body
    const apply = () => {
      const small = window.innerWidth < 768
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (small || prefersReducedMotion) {
        root.classList.add("mobile-perf")
      } else {
        root.classList.remove("mobile-perf")
      }
    }
    apply()
    window.addEventListener("resize", apply)
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    mql.addEventListener?.("change", apply)
    return () => {
      window.removeEventListener("resize", apply)
      mql.removeEventListener?.("change", apply)
    }
  }, [])

  return null
}
