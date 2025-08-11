// Обработчик ошибок загрузки chunks
export class ChunkErrorHandler {
  private static retryCount = 0
  private static maxRetries = 3
  private static retryDelay = 1000

  static init() {
    // Обработка ошибок загрузки chunks
    window.addEventListener("error", this.handleChunkError.bind(this))
    window.addEventListener("unhandledrejection", this.handlePromiseRejection.bind(this))
  }

  private static handleChunkError(event: ErrorEvent) {
    const error = event.error

    if (this.isChunkLoadError(error)) {
      console.warn("Chunk load error detected:", error)
      this.retryChunkLoad()
    }
  }

  private static handlePromiseRejection(event: PromiseRejectionEvent) {
    const error = event.reason

    if (this.isChunkLoadError(error)) {
      console.warn("Chunk load promise rejection:", error)
      this.retryChunkLoad()
      event.preventDefault() // Предотвращаем показ ошибки в консоли
    }
  }

  private static isChunkLoadError(error: any): boolean {
    if (!error) return false

    const errorMessage = error.message || error.toString()

    return (
      errorMessage.includes("ChunkLoadError") ||
      errorMessage.includes("Loading chunk") ||
      errorMessage.includes("failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      error.name === "ChunkLoadError"
    )
  }

  private static async retryChunkLoad() {
    if (this.retryCount >= this.maxRetries) {
      console.error("Max chunk load retries reached. Reloading page...")
      this.showErrorNotification()
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      return
    }

    this.retryCount++
    console.log(`Retrying chunk load (attempt ${this.retryCount}/${this.maxRetries})`)

    // Показываем уведомление пользователю
    this.showRetryNotification()

    // Ждем перед повторной попыткой
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay))

    try {
      // Пытаемся перезагрузить страницу
      window.location.reload()
    } catch (error) {
      console.error("Failed to reload after chunk error:", error)
    }
  }

  private static showRetryNotification() {
    // Создаем уведомление о повторной попытке
    const notification = document.createElement("div")
    notification.className = "fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>Загрузка компонентов... (${this.retryCount}/${this.maxRetries})</span>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  private static showErrorNotification() {
    // Создаем уведомление об ошибке
    const notification = document.createElement("div")
    notification.className = "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>Ошибка загрузки. Перезагрузка страницы...</span>
      </div>
    `

    document.body.appendChild(notification)
  }

  static reset() {
    this.retryCount = 0
  }
}

// Автоматическая инициализация при загрузке
if (typeof window !== "undefined") {
  ChunkErrorHandler.init()
}
