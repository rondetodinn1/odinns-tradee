import type React from "react"
import { cn } from "@/lib/utils"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className={cn("grid gap-6", className)}>{children}</div>
      </main>
    </div>
  )
}
