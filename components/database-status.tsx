"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Database, Wifi, WifiOff } from "lucide-react"

interface DatabaseStatusIndicatorProps {
  className?: string
}

export function DatabaseStatusIndicator({ className = "" }: DatabaseStatusIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id").limit(1)
      setIsConnected(!error)
    } catch (err) {
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Badge className={`bg-slate-800/50 text-slate-400 border-slate-600/30 animate-pulse ${className}`}>
        <Database className="w-3 h-3 mr-1" />
        Checking...
      </Badge>
    )
  }

  return (
    <Badge
      className={`transition-all duration-300 ${
        isConnected
          ? "bg-green-500/20 text-green-400 border-green-400/30 shadow-green-400/20"
          : "bg-red-500/20 text-red-400 border-red-400/30 shadow-red-400/20"
      } ${className}`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          Database Connected
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Database Offline
        </>
      )}
    </Badge>
  )
}
