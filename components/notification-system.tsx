"use client"

export type Notification = {
  id: string
  title: string
  message?: string
  variant?: "default" | "success" | "warning" | "error"
}

export type NotificationSystemProps = {
  className?: string
  notifications?: Notification[]
}

export function NotificationSystem({ className, notifications = [] }: NotificationSystemProps) {
  if (!notifications.length) return null
  return (
    <div className={className ?? ""} role="status" aria-live="polite">
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li key={n.id} className="rounded-md border border-border/60 p-3">
            <div className="font-medium">{n.title}</div>
            {n.message ? <div className="text-sm text-muted-foreground">{n.message}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default NotificationSystem
