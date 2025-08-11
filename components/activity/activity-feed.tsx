"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatTimeAgo } from "@/lib/utils"
import { Bitcoin, TrendingUp, TrendingDown, AlertCircle, Newspaper, Award } from "lucide-react"

// Local, safe mock fetcher to avoid importing from lib/api
async function fetchActivityFeed() {
  // Simulate a tiny delay
  await new Promise((r) => setTimeout(r, 150))
  return [
    {
      id: "1",
      user: { name: "Alice", avatar: "" },
      type: "price_up",
      message: "BTC moved +2.1%",
      timestamp: Date.now() - 60 * 1000,
      details: "Momentum increasing on 1h",
    },
    {
      id: "2",
      user: { name: "Bob", avatar: "" },
      type: "news",
      message: "FOMC minutes released",
      timestamp: Date.now() - 5 * 60 * 1000,
      details: "Volatility expected",
    },
    {
      id: "3",
      user: { name: "Carol", avatar: "" },
      type: "achievement",
      message: "New P/L milestone reached",
      timestamp: Date.now() - 12 * 60 * 1000,
      details: "",
    },
  ]
}

export function ActivityFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["activityFeed"],
    queryFn: fetchActivityFeed,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return <ActivityFeedSkeleton />
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load activity feed.</p>
        </CardContent>
      </Card>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "price_alert":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "price_up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "price_down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "transaction":
        return <Bitcoin className="h-4 w-4 text-orange-500" />
      case "news":
        return <Newspaper className="h-4 w-4 text-blue-500" />
      case "achievement":
        return <Award className="h-4 w-4 text-purple-500" />
      default:
        return <Bitcoin className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Activity Feed</span>
          <Badge variant="outline">{data.length} updates</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {data.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={activity.user?.avatar || "/placeholder.svg?height=32&width=32&query=avatar"}
                    alt={activity.user?.name}
                  />
                  <AvatarFallback>{activity.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.user?.name || "Anonymous"}</p>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getActivityIcon(activity.type)}
                    <p className="text-sm">{activity.message}</p>
                  </div>
                  {activity.details ? (
                    <p className="text-xs text-muted-foreground mt-1 pl-6">{activity.details}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  {i % 2 === 0 && <Skeleton className="h-3 w-4/5 mt-1" />}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
