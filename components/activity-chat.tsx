"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getSupabaseClient } from "@/lib/supabase"
import { activityLogger } from "@/lib/activity-logger"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  Send,
  Activity,
  User,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  RefreshCw,
  Pin,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface ActivityMessage {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  message: string
  activity_type: string
  metadata?: any
  created_at: string
  is_pinned?: boolean
}

interface ActivityChatProps {
  currentUser: any
}

export function ActivityChat({ currentUser }: ActivityChatProps) {
  const supabase = getSupabaseClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ActivityMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    loadMessages()

    // Подписка на новые сообщения
    const subscription = supabase
      .channel("activity_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_messages",
        },
        () => {
          loadMessages()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error)
      toast.error("Ошибка загрузки сообщений")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    try {
      setIsSending(true)

      await activityLogger.logActivity(currentUser.id, "chat_message", newMessage.trim(), {
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        timestamp: new Date().toISOString(),
      })

      setNewMessage("")
      toast.success("Сообщение отправлено")
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error)
      toast.error("Ошибка отправки сообщения")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const togglePin = async (messageId: string, currentPinStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("activity_messages")
        .update({ is_pinned: !currentPinStatus })
        .eq("id", messageId)

      if (error) throw error

      // Обновляем локальное состояние
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, is_pinned: !currentPinStatus } : msg)))

      toast.success(!currentPinStatus ? "Сообщение закреплено" : "Сообщение откреплено")
    } catch (error) {
      console.error("Ошибка изменения статуса закрепления:", error)
      toast.error("Ошибка изменения статуса")
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.from("activity_messages").delete().eq("id", messageId)

      if (error) throw error

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      toast.success("Сообщение удалено")
    } catch (error) {
      console.error("Ошибка удаления сообщения:", error)
      toast.error("Ошибка удаления сообщения")
    }
  }

  const startEditing = (message: ActivityMessage) => {
    setEditingMessageId(message.id)
    setEditingText(message.message)
  }

  const saveEdit = async (messageId: string) => {
    if (!editingText.trim()) return

    try {
      const { error } = await supabase
        .from("activity_messages")
        .update({ message: editingText.trim() })
        .eq("id", messageId)

      if (error) throw error

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, message: editingText.trim() } : msg)))

      setEditingMessageId(null)
      setEditingText("")
      toast.success("Сообщение обновлено")
    } catch (error) {
      console.error("Ошибка редактирования сообщения:", error)
      toast.error("Ошибка редактирования")
    }
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingText("")
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "trade_added":
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case "trade_updated":
        return <TrendingDown className="w-4 h-4 text-blue-400" />
      case "balance_updated":
        return <DollarSign className="w-4 h-4 text-yellow-400" />
      case "status_changed":
        return <User className="w-4 h-4 text-purple-400" />
      case "chat_message":
        return <MessageCircle className="w-4 h-4 text-cyan-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "trade_added":
        return "border-green-500/30 bg-green-500/10"
      case "trade_updated":
        return "border-blue-500/30 bg-blue-500/10"
      case "balance_updated":
        return "border-yellow-500/30 bg-yellow-500/10"
      case "status_changed":
        return "border-purple-500/30 bg-purple-500/10"
      case "chat_message":
        return "border-cyan-500/30 bg-cyan-500/10"
      default:
        return "border-gray-500/30 bg-gray-500/10"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "только что"
    if (diffInMinutes < 60) return `${diffInMinutes}м назад`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}ч назад`
    return date.toLocaleDateString("ru-RU")
  }

  const getAvatarUrl = (userId: string, userAvatarUrl?: string) => {
    if (!userId) return ""

    const localAvatar = localStorage.getItem(`avatar_${userId}`)
    if (localAvatar && localAvatar !== "null" && localAvatar !== "undefined") {
      return localAvatar
    }
    if (userAvatarUrl && userAvatarUrl !== "null" && userAvatarUrl !== "undefined") {
      return userAvatarUrl
    }
    return ""
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-cyan-900/20 backdrop-blur-xl border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/10 h-full flex flex-col">
      <CardHeader className="p-6 border-b border-cyan-500/20 flex-shrink-0">
        <CardTitle className="text-white text-xl font-bold flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-cyan-400" />
          Лента активности
          <Button
            onClick={loadMessages}
            disabled={isLoading}
            size="sm"
            className="ml-auto bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
              <span className="text-white/60">Загрузка сообщений...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Нет сообщений</h3>
              <p className="text-white/60">Станьте первым, кто напишет сообщение!</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative p-4 rounded-2xl border ${getActivityColor(message.activity_type)} ${
                    message.is_pinned ? "ring-2 ring-yellow-400/50" : ""
                  } group`}
                >
                  {message.is_pinned && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Pin className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-white/20 flex-shrink-0">
                      <AvatarImage
                        src={getAvatarUrl(message.user_id, message.avatar_url) || "/placeholder.svg"}
                        alt={message.username || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-sm font-bold">
                        {(message.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-semibold">{message.username || "Unknown User"}</span>
                        {getActivityIcon(message.activity_type)}
                        <Badge variant="secondary" className="bg-white/10 text-white/70 border-white/20 text-xs">
                          {message.activity_type === "chat_message" && "Сообщение"}
                          {message.activity_type === "trade_added" && "Новая сделка"}
                          {message.activity_type === "trade_updated" && "Обновление сделки"}
                          {message.activity_type === "balance_updated" && "Баланс"}
                          {message.activity_type === "status_changed" && "Статус"}
                          {message.activity_type === "trade_pinned" && "Закрепление"}
                        </Badge>
                        <div className="flex items-center gap-1 text-white/50 text-xs ml-auto">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(message.created_at)}</span>
                        </div>
                      </div>

                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="bg-white/10 border-white/20 text-white rounded-lg"
                            placeholder="Редактировать сообщение..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveEdit(message.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              size="sm"
                              className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg h-8"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white/90 text-sm leading-relaxed break-words">{message.message || ""}</p>
                      )}

                      {/* Message Actions */}
                      {message.user_id === currentUser?.id && editingMessageId !== message.id && (
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => togglePin(message.id, message.is_pinned || false)}
                            size="sm"
                            className={`h-7 px-2 rounded-lg text-xs ${
                              message.is_pinned
                                ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white/70 border border-white/20"
                            }`}
                          >
                            <Pin className="w-3 h-3" />
                          </Button>

                          {message.activity_type === "chat_message" && (
                            <>
                              <Button
                                onClick={() => startEditing(message)}
                                size="sm"
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 h-7 px-2 rounded-lg text-xs"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => deleteMessage(message.id)}
                                size="sm"
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-7 px-2 rounded-lg text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-cyan-500/20 flex-shrink-0">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl h-12"
              disabled={isSending}
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl h-12 px-6 shadow-lg shadow-cyan-500/25"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>

          {newMessage.length > 0 && (
            <div className="mt-2 text-right">
              <span className={`text-xs ${newMessage.length > 450 ? "text-red-400" : "text-white/50"}`}>
                {newMessage.length}/500
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
