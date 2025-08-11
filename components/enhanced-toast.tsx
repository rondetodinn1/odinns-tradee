"use client"

import React from "react"

import { toast } from "sonner"
import { CheckCircle, AlertTriangle, XCircle, Info, Sparkles, TrendingUp, Activity, User, Target, Key, Edit } from 'lucide-react'

type ToastOptions = {
  title?: string
  description?: string
  duration?: number
}

export const enhancedToast = {
  success: (_msg: string, _opts?: ToastOptions) => {},
  error: (_msg: string, _opts?: ToastOptions) => {},
  warning: (_msg: string, _opts?: ToastOptions) => {},
  info: (_msg: string, _opts?: ToastOptions) => {},
  status: (_msg: string, _status: string, _opts?: ToastOptions) => {},
  welcome: (_username: string, _opts?: ToastOptions) => {},
  avatar: (_msg: string, _opts?: ToastOptions) => {},
  goal: (_msg: string, _opts?: ToastOptions) => {},
  security: (_msg: string, _type: "password" | "nickname" = "password", _opts?: ToastOptions) => {},
}
