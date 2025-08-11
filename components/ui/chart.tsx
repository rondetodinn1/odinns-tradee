"use client"

import * as React from "react"
import { Legend as RechartsLegend } from "recharts"

// Config type to define labels/colors for data keys
export type ChartConfig = Record<
  string,
  {
    label?: string
    color?: string
  }
>

type ChartContextValue = {
  config?: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue>({})

export function useChart() {
  return React.useContext(ChartContext)
}

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: Record<string, unknown>
}

export function ChartContainer({ className, children, ...rest }: ChartContainerProps) {
  return (
    <div className={`relative h-full w-full ${className ?? ""}`} {...rest}>
      {children}
    </div>
  )
}

// Tooltip

export interface ChartTooltipProps {
  // Kept as any shape to be compatible with various chart libs
  cursor?: any
  content?: React.ReactNode
  className?: string
}

export function ChartTooltip(_props: ChartTooltipProps) {
  // No-op to avoid tight dependency on specific chart lib props.
  return null
}

export interface ChartTooltipContentProps {
  className?: string
  indicator?: "dot" | "line" | "none"
  hideLabel?: boolean
  hideIndicator?: boolean
  // flexible payload to avoid type friction
  payload?: any
  active?: boolean
  label?: React.ReactNode
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  function ChartTooltipContent({ className }, ref) {
    return <div ref={ref} className={className} />
  },
)

// Legend

export type ChartLegendProps = React.ComponentProps<typeof RechartsLegend>

export function ChartLegend(props: ChartLegendProps) {
  return <RechartsLegend {...props} />
}

export interface ChartLegendContentProps {
  className?: string
  payload?: any[]
  verticalAlign?: "top" | "middle" | "bottom"
  nameKey?: string
  hideIcon?: boolean
}

export function ChartLegendContent(_props: ChartLegendContentProps) {
  // Render nothing by default. Implement later if needed.
  return null
}
