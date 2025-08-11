import { getSupabaseClient } from "./supabase"

export interface ActivityLog {
  id: string
  username: string
  action_type: string
  description: string
  created_at: string
  metadata?: {
    cryptocurrency?: string
    price?: number
    action_type?: string
    [key: string]: any
  }
}

class ActivityLogger {
  private supabase = getSupabaseClient()

  async logActivity(
    userId: string,
    actionType: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // Получаем username по userId
      const { data: user } = await this.supabase.from("users").select("username").eq("id", userId).single()

      const username = user?.username || "Unknown"

      // Логируем в crypto_journal как активность
      const activityData = {
        user_id: userId,
        created_by_username: username,
        cryptocurrency: metadata?.cryptocurrency || "ACTIVITY",
        action_type: actionType,
        price: metadata?.price || 0,
        quantity: 0,
        notes: description,
        metadata: metadata || {},
      }

      await this.supabase.from("crypto_journal").insert([activityData])
    } catch (error) {
      console.error("Error logging activity:", error)
    }
  }

  async getRecentActivity(limit = 20): Promise<ActivityLog[]> {
    try {
      const { data: activities } = await this.supabase
        .from("crypto_journal")
        .select("*, users(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!activities) return []

      return activities.map((activity) => ({
        id: activity.id,
        username: activity.users?.username || activity.created_by_username || "Unknown",
        action_type: activity.action_type || "trade_added",
        description: activity.notes || `${activity.action_type} ${activity.cryptocurrency} at $${activity.price}`,
        created_at: activity.created_at,
        metadata: {
          cryptocurrency: activity.cryptocurrency,
          price: activity.price,
          action_type: activity.action_type,
          ...activity.metadata,
        },
      }))
    } catch (error) {
      console.error("Error fetching recent activity:", error)
      return []
    }
  }

  async getAllActivity(limit = 50): Promise<ActivityLog[]> {
    try {
      const { data: activities } = await this.supabase
        .from("crypto_journal")
        .select("*, users(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!activities) return []

      return activities.map((activity) => ({
        id: activity.id,
        username: activity.users?.username || activity.created_by_username || "Unknown",
        action_type: activity.action_type || "trade_added",
        description: activity.notes || `${activity.action_type} ${activity.cryptocurrency} at $${activity.price}`,
        created_at: activity.created_at,
        metadata: {
          cryptocurrency: activity.cryptocurrency,
          price: activity.price,
          action_type: activity.action_type,
          ...activity.metadata,
        },
      }))
    } catch (error) {
      console.error("Error fetching all activity:", error)
      return []
    }
  }

  subscribeToActivity(callback: (activity: ActivityLog) => void) {
    const subscription = this.supabase
      .channel("crypto_journal_activity")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crypto_journal",
        },
        async (payload) => {
          const newRecord = payload.new as any

          // Получаем информацию о пользователе
          const { data: user } = await this.supabase
            .from("users")
            .select("username, avatar_url")
            .eq("id", newRecord.created_by)
            .single()

          const activity: ActivityLog = {
            id: newRecord.id,
            username: user?.username || newRecord.created_by_username || "Unknown",
            action_type: newRecord.action_type || "trade_added",
            description:
              newRecord.notes || `${newRecord.action_type} ${newRecord.cryptocurrency} at $${newRecord.price}`,
            created_at: newRecord.created_at,
            metadata: {
              cryptocurrency: newRecord.cryptocurrency,
              price: newRecord.price,
              action_type: newRecord.action_type,
              ...newRecord.metadata,
            },
          }

          callback(activity)
        },
      )
      .subscribe()

    return subscription
  }
}

export const activityLogger = new ActivityLogger()
