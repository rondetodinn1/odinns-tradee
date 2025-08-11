"use client"

import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isChunkError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Loading chunk") ||
      error.name === "ChunkLoadError"

    return {
      hasError: true,
      error,
      errorInfo: null,
      isChunkError,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Отправляем ошибку в систему мониторинга (если настроена)
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      // Специальная обработка для ChunkLoadError
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Обновление компонентов</CardTitle>
                <CardDescription className="text-gray-600">
                  Приложение обновляется. Пожалуйста, подождите...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">Это может занять несколько секунд</p>
                  <Button onClick={this.handleReload} className="w-full" variant="default">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Перезагрузить сейчас
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      // Пользовательский fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Стандартная обработка ошибок
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Произошла ошибка</CardTitle>
              <CardDescription className="text-gray-600">
                Что-то пошло не так. Попробуйте обновить страницу или вернуться на главную.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Детали ошибки (только в режиме разработки):
                  </h4>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1 bg-transparent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Попробовать снова
                </Button>
                <Button onClick={this.handleReload} variant="default" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Перезагрузить
                </Button>
              </div>

              <Button onClick={this.handleGoHome} variant="ghost" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                На главную
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC для оборачивания компонентов
export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, fallback?: ReactNode) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook для обработки ошибок в функциональных компонентах
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo)

    // Можно добавить отправку ошибки в систему мониторинга
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      })
    }
  }
}
