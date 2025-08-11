"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, MessageSquare, User, LogOut, Menu, X, Target } from "lucide-react"

interface NavigationProps {
  user: any
  currentView: string
  onViewChange: (view: string) => void
  onLogout: () => void
}

export function Navigation({ user, currentView, onViewChange, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const username = user?.username || "User"
  const avatarUrl = user?.avatar_url || "/placeholder.svg"

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "journal", label: "Crypto Journal", icon: BookOpen },
    { id: "status", label: "Status Updates", icon: MessageSquare },
    { id: "goals", label: "Financial Goals", icon: Target },
  ]

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <h1 className="text-2xl font-bold text-gradient">ODINNS</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <Button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive ? "bg-white/20 text-white shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Profile */}
              <Button
                onClick={() => onViewChange("profile")}
                variant="ghost"
                className={`hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  currentView === "profile"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Profile</span>
              </Button>

              {/* Avatar */}
              <Avatar className="w-10 h-10 border-2 border-white/20">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
                <AvatarFallback className="bg-blue-600 text-white">{username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              {/* Logout */}
              <Button
                onClick={onLogout}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Mobile menu button */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden text-white hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentView === item.id
                  return (
                    <Button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      variant="ghost"
                      className={`w-full justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  )
                })}
                <Button
                  onClick={() => handleNavClick("profile")}
                  variant="ghost"
                  className={`w-full justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    currentView === "profile"
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
