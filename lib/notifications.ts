import { getSupabaseClient } from "@/lib/supabase"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "system" | "trade" | "achievement" | "alert"
  read: boolean
  created_at: string
  sender?: string
}

export class NotificationSystem {
  private static instance: NotificationSystem
  private supabase = getSupabaseClient()
  private localStorageKey = "odinns_notifications"

  private constructor() {}

  public static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem()
    }
    return NotificationSystem.instance
  }

  // Get notifications for a user
  public async getNotifications(userId: string): Promise<Notification[]> {
    try {
      // Try to get from Supabase first - using user_id instead of userId
      const { data, error } = await this.supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching notifications from Supabase:", error)
        // Fallback to local storage
        return this.getLocalNotifications(userId)
      }

      return data as Notification[]
    } catch (error) {
      console.error("Error in getNotifications:", error)
      // Fallback to local storage
      return this.getLocalNotifications(userId)
    }
  }

  // Add a new notification
  public async addNotification(notification: Omit<Notification, "id" | "created_at">): Promise<boolean> {
    try {
      const newNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
        sender: notification.sender || notification.user_id, // Use sender if provided, otherwise use user_id
      }

      // Try to save to Supabase
      const { error } = await this.supabase.from("notifications").insert(newNotification)

      if (error) {
        console.error("Error saving notification to Supabase:", error)
        // Fallback to local storage
        return this.addLocalNotification(newNotification)
      }

      return true
    } catch (error) {
      console.error("Error in addNotification:", error)
      // Fallback to local storage
      return this.addLocalNotification(notification as Notification)
    }
  }

  // Mark notification as read
  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Try to update in Supabase
      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", userId)

      if (error) {
        console.error("Error marking notification as read in Supabase:", error)
        // Fallback to local storage
        return this.markLocalNotificationAsRead(notificationId, userId)
      }

      return true
    } catch (error) {
      console.error("Error in markAsRead:", error)
      // Fallback to local storage
      return this.markLocalNotificationAsRead(notificationId, userId)
    }
  }

  // Delete a notification
  public async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Try to delete from Supabase
      const { error } = await this.supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting notification from Supabase:", error)
        // Fallback to local storage
        return this.deleteLocalNotification(notificationId, userId)
      }

      return true
    } catch (error) {
      console.error("Error in deleteNotification:", error)
      // Fallback to local storage
      return this.deleteLocalNotification(notificationId, userId)
    }
  }

  // Local storage fallback methods
  private getLocalNotifications(userId: string): Notification[] {
    try {
      const storedNotifications = localStorage.getItem(this.localStorageKey)
      if (!storedNotifications) return []

      const allNotifications = JSON.parse(storedNotifications) as Notification[]
      return allNotifications
        .filter((n) => n.user_id === userId)
        .sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    } catch (error) {
      console.error("Error getting local notifications:", error)
      return []
    }
  }

  private addLocalNotification(notification: Notification): boolean {
    try {
      const storedNotifications = localStorage.getItem(this.localStorageKey)
      const allNotifications = storedNotifications ? JSON.parse(storedNotifications) : []
      allNotifications.push(notification)
      localStorage.setItem(this.localStorageKey, JSON.stringify(allNotifications))
      return true
    } catch (error) {
      console.error("Error adding local notification:", error)
      return false
    }
  }

  private markLocalNotificationAsRead(notificationId: string, userId: string): boolean {
    try {
      const storedNotifications = localStorage.getItem(this.localStorageKey)
      if (!storedNotifications) return false

      const allNotifications = JSON.parse(storedNotifications) as Notification[]
      const updatedNotifications = allNotifications.map((n) => {
        if (n.id === notificationId && n.user_id === userId) {
          return { ...n, read: true }
        }
        return n
      })

      localStorage.setItem(this.localStorageKey, JSON.stringify(updatedNotifications))
      return true
    } catch (error) {
      console.error("Error marking local notification as read:", error)
      return false
    }
  }

  private deleteLocalNotification(notificationId: string, userId: string): boolean {
    try {
      const storedNotifications = localStorage.getItem(this.localStorageKey)
      if (!storedNotifications) return false

      const allNotifications = JSON.parse(storedNotifications) as Notification[]
      const updatedNotifications = allNotifications.filter((n) => !(n.id === notificationId && n.user_id === userId))

      localStorage.setItem(this.localStorageKey, JSON.stringify(updatedNotifications))
      return true
    } catch (error) {
      console.error("Error deleting local notification:", error)
      return false
    }
  }
}

export const notificationSystem = NotificationSystem.getInstance()
