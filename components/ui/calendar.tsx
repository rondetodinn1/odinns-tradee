"use client"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import "react-day-picker/dist/style.css"

export type CalendarProps = DayPickerProps

export function Calendar(props: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      fixedWeeks
      weekStartsOn={1}
      {...props}
      // Keep styles minimal; consumers can override with Tailwind
      className={`p-2 ${props.className ?? ""}`}
    />
  )
}
