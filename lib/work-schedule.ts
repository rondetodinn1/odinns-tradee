import { supabase } from "./supabase"

export interface WorkSchedule {
  id: string
  user_id: string
  start_time: string
  end_time: string
  timezone: string
  not_trading_today?: boolean
  not_trading_date?: string
  created_at: string
  updated_at: string
}

export const workScheduleService = {
  async getWorkSchedule(userId: string): Promise<WorkSchedule | null> {
    try {
      const { data, error } = await supabase.from("work_schedule").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching work schedule:", error)
        return null
      }

      // Check if "not trading today" should be reset
      if (data && data.not_trading_today && data.not_trading_date) {
        const notTradingDate = new Date(data.not_trading_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        notTradingDate.setHours(0, 0, 0, 0)

        if (today > notTradingDate) {
          // Reset not trading today
          await this.setNotTradingToday(userId, false)
          if (data) {
            data.not_trading_today = false
            data.not_trading_date = null
          }
        }
      }

      return data
    } catch (error) {
      console.error("Error fetching work schedule:", error)
      return null
    }
  },

  async updateWorkSchedule(userId: string, startTime: string, endTime: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("work_schedule").upsert(
        {
          user_id: userId,
          start_time: startTime,
          end_time: endTime,
          timezone: "Europe/Kiev",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) {
        console.error("Error updating work schedule:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating work schedule:", error)
      return false
    }
  },

  async setNotTradingToday(userId: string, notTrading: boolean): Promise<boolean> {
    try {
      // First, get existing schedule or create default values
      const existingSchedule = await this.getWorkSchedule(userId)

      const updateData: any = {
        user_id: userId,
        start_time: existingSchedule?.start_time || "09:00:00",
        end_time: existingSchedule?.end_time || "18:00:00",
        timezone: "Europe/Kiev",
        not_trading_today: notTrading,
        updated_at: new Date().toISOString(),
      }

      if (notTrading) {
        updateData.not_trading_date = new Date().toISOString()
      } else {
        updateData.not_trading_date = null
      }

      const { error } = await supabase.from("work_schedule").upsert(updateData, {
        onConflict: "user_id",
      })

      if (error) {
        console.error("Error setting not trading today:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error setting not trading today:", error)
      return false
    }
  },

  isWorkingNow(schedule: WorkSchedule): boolean {
    if (!schedule || schedule.not_trading_today) return false

    const now = new Date()
    const ukraineTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }))
    const currentTime = ukraineTime.getHours() * 60 + ukraineTime.getMinutes()

    const [startHour, startMinute] = schedule.start_time.split(":").map(Number)
    const [endHour, endMinute] = schedule.end_time.split(":").map(Number)

    const startTimeMinutes = startHour * 60 + startMinute
    const endTimeMinutes = endHour * 60 + endMinute

    // Handle overnight shifts
    if (startTimeMinutes > endTimeMinutes) {
      return currentTime >= startTimeMinutes || currentTime <= endTimeMinutes
    }

    return currentTime >= startTimeMinutes && currentTime <= endTimeMinutes
  },

  getWorkStatus(schedule: WorkSchedule): {
    isWorking: boolean
    message: string
    nextChange: string
  } {
    if (!schedule) {
      return {
        isWorking: false,
        message: "Working hours not set",
        nextChange: "",
      }
    }

    if (schedule.not_trading_today) {
      return {
        isWorking: false,
        message: "Не торгую сегодня",
        nextChange: "завтра в " + schedule.start_time,
      }
    }

    const now = new Date()
    const ukraineTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }))
    const isWorking = this.isWorkingNow(schedule)

    if (isWorking) {
      return {
        isWorking: true,
        message: `Working until ${schedule.end_time}`,
        nextChange: schedule.end_time,
      }
    } else {
      return {
        isWorking: false,
        message: `Starts work at ${schedule.start_time}`,
        nextChange: schedule.start_time,
      }
    }
  },

  formatTime(time: string): string {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  },
}
