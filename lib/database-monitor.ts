import { supabase } from "./supabase"

export interface DatabaseStatus {
  isConnected: boolean
  latency: number
  lastChecked: Date
  error?: string
}

class DatabaseMonitor {
  private status: DatabaseStatus = {
    isConnected: false,
    latency: 0,
    lastChecked: new Date(),
  }

  private listeners: ((status: DatabaseStatus) => void)[] = []
  private intervalId: NodeJS.Timeout | null = null

  async checkConnection(): Promise<DatabaseStatus> {
    const startTime = Date.now()

    try {
      // Check if we're using mock client
      const hasValidSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://demo.supabase.co"

      if (!hasValidSupabase) {
        // Mock connection for demo
        const latency = 50 + Math.random() * 100 // Simulate 50-150ms latency
        this.status = {
          isConnected: true,
          latency: Math.round(latency),
          lastChecked: new Date(),
        }
      } else {
        const { data, error } = await supabase.from("users").select("count").limit(1).single()
        const latency = Date.now() - startTime

        this.status = {
          isConnected: !error,
          latency,
          lastChecked: new Date(),
          error: error?.message,
        }
      }
    } catch (err) {
      this.status = {
        isConnected: false,
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }

    this.notifyListeners()
    return this.status
  }

  subscribe(callback: (status: DatabaseStatus) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.status))
  }

  getStatus(): DatabaseStatus {
    return this.status
  }

  startMonitoring(interval = 30000) {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // If interval is 0, just check once and don't set up recurring checks
    if (interval === 0) {
      return this.checkConnection()
    }

    // Check immediately
    this.checkConnection()

    // Set up recurring checks
    this.intervalId = setInterval(() => this.checkConnection(), interval)
    return this.intervalId
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

export const dbMonitor = new DatabaseMonitor()
