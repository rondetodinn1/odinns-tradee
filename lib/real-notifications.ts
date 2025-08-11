export interface Notification {
  id: string
  user_id: string
  type: "ACHIEVEMENT" | "TRADE" | "GOAL" | "SYSTEM" | "MARKET" | "SOCIAL"
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
  expires_at?: string
  action?: {
    label: string
    url?: string
    onClick?: () => void
  }
}

export interface NotificationPreferences {
  achievements: boolean
  trades: boolean
  goals: boolean
  market: boolean
  social: boolean
  system: boolean
}

export class RealNotificationSystem {
  private static listeners: Map<string, (notifications: Notification[]) => void> = new Map()
  private static notifications: Map<string, Notification[]> = new Map()
  private static preferences: Map<string, NotificationPreferences> = new Map()

  static async createNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    data?: any,
    expiresIn?: number,
  ): Promise<void> {
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn).toISOString() : undefined

      const notification: Notification = {
        id: crypto.randomUUID(),
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      }

      // Get user notifications or create empty array
      const userNotifications = this.notifications.get(userId) || []

      // Add new notification to the beginning
      userNotifications.unshift(notification)

      // Keep only last 50 notifications
      if (userNotifications.length > 50) {
        userNotifications.splice(50)
      }

      // Store updated notifications
      this.notifications.set(userId, userNotifications)

      console.log(`✅ Notification created: ${title} for user ${userId}`)

      // Trigger real-time update
      this.notifyListeners(userId)
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  // Memory fallback for notifications when database is unavailable
  private static _memoryNotifications: any[] = []

  static async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const userNotifications = this.notifications.get(userId) || []

      // Filter out expired notifications
      const validNotifications = userNotifications.filter((notification) => {
        if (!notification.expires_at) return true
        return new Date(notification.expires_at) > new Date()
      })

      // Update stored notifications (remove expired ones)
      this.notifications.set(userId, validNotifications)

      return validNotifications.slice(0, limit)
    } catch (error) {
      console.error("Error getting user notifications:", error)
      return []
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      // Find and update notification across all users
      for (const [userId, userNotifications] of this.notifications.entries()) {
        const notification = userNotifications.find((n) => n.id === notificationId)
        if (notification) {
          notification.read = true
          this.notifyListeners(userId)
          break
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const userNotifications = this.notifications.get(userId) || []
      userNotifications.forEach((notification) => {
        notification.read = true
      })
      this.notifyListeners(userId)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Find and remove notification across all users
      for (const [userId, userNotifications] of this.notifications.entries()) {
        const index = userNotifications.findIndex((n) => n.id === notificationId)
        if (index !== -1) {
          userNotifications.splice(index, 1)
          this.notifyListeners(userId)
          break
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const userNotifications = this.notifications.get(userId) || []
      return userNotifications.filter((n) => !n.read && (!n.expires_at || new Date(n.expires_at) > new Date())).length
    } catch (error) {
      console.error("Error getting unread count:", error)
      return 0
    }
  }

  static async createAchievementNotification(userId: string, achievement: any): Promise<void> {
    await this.createNotification(
      userId,
      "ACHIEVEMENT",
      "🎉 Achievement Unlocked!",
      `You've earned "${achievement.title}" - ${achievement.description}`,
      { achievementId: achievement.id, points: achievement.points },
      7 * 24 * 60 * 60 * 1000, // 7 days
    )
  }

  static async createTradeNotification(userId: string, trade: any): Promise<void> {
    const isProfit = trade.profit_loss > 0
    const title = isProfit ? "💰 Profitable Trade!" : "📉 Trade Closed"
    const message = `${trade.symbol}: ${isProfit ? "+" : ""}$${trade.profit_loss.toFixed(2)}`

    await this.createNotification(
      userId,
      "TRADE",
      title,
      message,
      { tradeId: trade.id, profitLoss: trade.profit_loss },
      24 * 60 * 60 * 1000, // 24 hours
    )
  }

  static async createGoalNotification(userId: string, goal: any): Promise<void> {
    await this.createNotification(
      userId,
      "GOAL",
      "🎯 Goal Completed!",
      `You've achieved your goal: ${goal.title}`,
      { goalId: goal.id },
      7 * 24 * 60 * 60 * 1000, // 7 days
    )
  }

  static async createMarketNotification(userId: string, signal: string, confidence: number): Promise<void> {
    try {
      const title =
        signal === "STRONG_BUY"
          ? "🚀 Strong Buy Signal!"
          : signal === "STRONG_SELL"
            ? "🔻 Strong Sell Signal!"
            : signal === "BUY"
              ? "📈 Buy Signal"
              : signal === "SELL"
                ? "📉 Sell Signal"
                : "📊 Market Update"

      await this.createNotification(
        userId,
        "MARKET",
        title,
        `Bitcoin analysis shows ${signal.replace("_", " ")} with ${confidence}% confidence`,
        { signal, confidence },
        4 * 60 * 60 * 1000, // 4 hours
      )
    } catch (error) {
      console.error("Error creating market notification:", error)
    }
  }

  static async createSystemNotification(userId: string, title: string, message: string): Promise<void> {
    await this.createNotification(
      userId,
      "SYSTEM",
      title,
      message,
      null,
      24 * 60 * 60 * 1000, // 24 hours
    )
  }

  static async createStatusUpdateNotification(
    userId: string,
    friendId: string,
    friendName: string,
    status: string,
  ): Promise<void> {
    await this.createNotification(
      userId,
      "SOCIAL",
      "👤 Status Update",
      `${friendName} has updated their status: "${status}"`,
      { friendId, status },
      24 * 60 * 60 * 1000, // 24 hours
    )
  }

  static subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void {
    this.listeners.set(userId, callback)

    // Initial load
    this.getUserNotifications(userId).then(callback)

    return () => {
      this.listeners.delete(userId)
    }
  }

  private static async notifyListeners(userId: string): Promise<void> {
    const callback = this.listeners.get(userId)
    if (callback) {
      const notifications = await this.getUserNotifications(userId)
      callback(notifications)
    }
  }

  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const userPreferences = this.preferences.get(userId)
      if (userPreferences) {
        return userPreferences
      }

      // Return default preferences
      const defaultPreferences: NotificationPreferences = {
        achievements: true,
        trades: true,
        goals: true,
        market: true,
        social: true,
        system: true,
      }

      this.preferences.set(userId, defaultPreferences)
      return defaultPreferences
    } catch (error) {
      console.error("Error getting user preferences:", error)
      return {
        achievements: true,
        trades: true,
        goals: true,
        market: true,
        social: true,
        system: true,
      }
    }
  }

  static async updateUserPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      this.preferences.set(userId, preferences)
      console.log(`✅ Updated preferences for user ${userId}`)
    } catch (error) {
      console.error("Error updating user preferences:", error)
    }
  }

  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date()
      for (const [userId, userNotifications] of this.notifications.entries()) {
        const validNotifications = userNotifications.filter((notification) => {
          if (!notification.expires_at) return true
          return new Date(notification.expires_at) > now
        })

        if (validNotifications.length !== userNotifications.length) {
          this.notifications.set(userId, validNotifications)
          this.notifyListeners(userId)
        }
      }
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error)
    }
  }

  // Initialize with some demo notifications
  static initializeDemoNotifications(userId: string): void {
    const demoNotifications: Notification[] = [
      {
        id: crypto.randomUUID(),
        user_id: userId,
        type: "MARKET",
        title: "🚀 Strong Buy Signal!",
        message: "Bitcoin analysis shows STRONG BUY with 85% confidence",
        data: { signal: "STRONG_BUY", confidence: 85 },
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      },
      {
        id: crypto.randomUUID(),
        user_id: userId,
        type: "ACHIEVEMENT",
        title: "🎉 Achievement Unlocked!",
        message: 'You\'ve earned "Bitcoin Analyst" - View Bitcoin analysis 10 times',
        data: { achievementId: "bitcoin_analyst", points: 50 },
        read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      },
      {
        id: crypto.randomUUID(),
        user_id: userId,
        type: "SOCIAL",
        title: "👤 Status Update",
        message: 'Alex has updated their status: "Just made a profitable Bitcoin trade! 🚀"',
        data: { friendId: "alex123", status: "Just made a profitable Bitcoin trade! 🚀" },
        read: true,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      },
      {
        id: crypto.randomUUID(),
        user_id: userId,
        type: "GOAL",
        title: "🎯 Goal Progress",
        message: "You're 80% towards your goal: Save $10,000 for Bitcoin investment",
        data: { goalId: "save_10k", progress: 80 },
        read: true,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
    ]

    this.notifications.set(userId, demoNotifications)
  }
}
