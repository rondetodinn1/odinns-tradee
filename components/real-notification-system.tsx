"use client"

import { useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface RealNotificationPanelProps {
  user?: { id?: string; name?: string } | null
  items?: Array<{ id: string; title: string; time: string }>
}

export function RealNotificationPanel({ user = null, items }: RealNotificationPanelProps) {
  const [open, setOpen] = useState(false)
  const data = items ?? [
    { id: "n1", title: "Welcome onboard", time: "now" },
    { id: "n2", title: "Portfolio synced", time: "1m" },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-medium">Notifications</div>
          <div className="flex items-center gap-2">
            {user?.name ? <Badge variant="secondary">{user.name}</Badge> : null}
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-64">
          <ul className="divide-y">
            {data.map((n) => (
              <li key={n.id} className="flex items-center justify-between p-3">
                <span className="text-sm">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
