"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  BarChart3,
  Target,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Bitcoin,
} from "lucide-react"
import { RealNotificationPanel } from "@/components/real-notification-system"

interface ImprovedNavigationProps {
  user: any
  currentView: string
  onViewChange: (view: string) => void
  onLogout: () => void
}

export function ImprovedNavigation({ user, currentView, onViewChange, onLogout }: ImprovedNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const username = user?.username || "User"
  const avatarUrl = user?.avatar_url || "/placeholder.svg"

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "journal", label: "Crypto Journal", icon: BookOpen },
    { id: "status", label: "Status Updates", icon: MessageSquare },
    { id: "comparison", label: "Daily Comparison", icon: BarChart3 },
    { id: "goals", label: "Financial Goals", icon: Target },
    { id: "bitcoin-analysis", label: "Bitcoin Center", icon: Bitcoin },
  ].filter((item) => item.id !== "ai-analysis")

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [showUserMenu])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">ODINNS</h1>
                <p className="text-xs text-purple-300 font-medium">BITCOIN PLATFORM</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-purple-600 text-white glow-purple"
                        : "text-gray-300 hover:text-white hover:bg-purple-600/20"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <RealNotificationPanel user={user} />

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 hover:bg-purple-600/20 rounded-lg p-2 transition-all duration-300"
                >
                  <Avatar className="w-8 h-8 border-2 border-purple-500/50">
                    <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white">{username}</p>
                    <p className="text-xs text-purple-300">Online</p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-48 glass-card rounded-xl p-2 fade-in">
                    <button
                      onClick={() => {
                        handleNavClick("profile")
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-purple-600/20 transition-all duration-300"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <div className="border-t border-purple-600/20 my-1"></div>
                    <button
                      onClick={() => {
                        onLogout()
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-purple-600/20 transition-all duration-300"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden glass-card mx-4 mb-4 rounded-2xl fade-in">
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white hover:bg-purple-600/20"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
              <div className="border-t border-purple-600/20 pt-2 mt-2">
                <button
                  onClick={() => handleNavClick("profile")}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-purple-600/20 transition-all duration-300"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16"></div>
    </>
  )
}
