import { NextResponse } from "next/server"

// Local types to avoid external type imports
type ActivityType = "price_alert" | "transaction" | "price_up" | "news" | "achievement" | "price_down"

interface ActivityUser {
  name: string
  avatar: string
}

interface ActivityItem {
  id: string
  type: ActivityType
  message: string
  details?: string
  timestamp: number
  user: ActivityUser
}

export async function GET() {
  try {
    const now = Date.now()
    const activities: ActivityItem[] = [
      {
        id: "act-1",
        type: "price_alert",
        message: "Bitcoin just crossed $60,000!",
        timestamp: now - 1000 * 60 * 5,
        user: { name: "System Alert", avatar: "" },
      },
      {
        id: "act-2",
        type: "transaction",
        message: "Large transaction detected",
        details: "1,500 BTC ($90M) transferred to unknown wallet",
        timestamp: now - 1000 * 60 * 22,
        user: { name: "Whale Alert", avatar: "" },
      },
      {
        id: "act-3",
        type: "price_up",
        message: "Bitcoin up 2.5% in the last hour",
        timestamp: now - 1000 * 60 * 55,
        user: { name: "Market Bot", avatar: "" },
      },
      {
        id: "act-4",
        type: "news",
        message: "SEC approves new Bitcoin ETF applications",
        details: "This could lead to increased institutional adoption",
        timestamp: now - 1000 * 60 * 120,
        user: { name: "Crypto News", avatar: "" },
      },
      {
        id: "act-5",
        type: "achievement",
        message: "You've earned the 'Market Analyst' badge!",
        details: "For viewing technical analysis 5 times",
        timestamp: now - 1000 * 60 * 180,
        user: { name: "Achievement System", avatar: "" },
      },
      {
        id: "act-6",
        type: "price_down",
        message: "Bitcoin down 1.2% in the last 4 hours",
        timestamp: now - 1000 * 60 * 240,
        user: { name: "Market Bot", avatar: "" },
      },
    ]

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activity feed:", error)
    return NextResponse.json({ error: "Failed to fetch activity feed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Minimal body parsing to avoid external types
    const { type, message, details, userId } = await request.json()

    // Validate minimally (optional):
    if (!type || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real app you'd save to DB here

    return NextResponse.json({
      success: true,
      message: "Activity recorded successfully",
    })
  } catch (error) {
    console.error("Error recording activity:", error)
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 })
  }
}
