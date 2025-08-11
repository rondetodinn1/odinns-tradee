"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"

export function TimeWidget() {
  const [currentTime, setCurrentTime] = useState("")
  const [timeUntilComparison, setTimeUntilComparison] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const ukraineTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }))

      setCurrentTime(
        ukraineTime.toLocaleString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      )

      // Calculate time until 20:00
      const currentHour = ukraineTime.getHours()
      const currentMinute = ukraineTime.getMinutes()

      const nextComparison = new Date(ukraineTime)
      if (currentHour >= 20) {
        nextComparison.setDate(nextComparison.getDate() + 1)
      }
      nextComparison.setHours(20, 0, 0, 0)

      const timeDiff = nextComparison.getTime() - ukraineTime.getTime()
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeUntilComparison(`${hours}h ${minutes}m`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-black/20 backdrop-blur-md border border-white/10 fixed top-20 right-4 z-40">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-400/80" />
          <span className="text-white/60 text-sm">Ukraine</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-400/80" />
          <span className="text-white/90 font-mono text-sm">{currentTime}</span>
        </div>
        <div className="border-t border-white/10 pt-2">
          <p className="text-white/50 text-xs">Next comparison:</p>
          <p className="text-yellow-400/90 font-semibold text-sm">{timeUntilComparison}</p>
        </div>
      </CardContent>
    </Card>
  )
}
