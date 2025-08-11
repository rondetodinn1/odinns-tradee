// Global typings for optional analytics to avoid TS errors in ErrorBoundary
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}
export {}
