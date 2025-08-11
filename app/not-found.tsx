"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  // Безопасно используем useState без начальной зависимости от localStorage
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Устанавливаем флаг только на клиенте
    setIsClient(true)
  }, [])

  // Рендерим базовую версию на сервере и улучшенную на клиенте
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Страница не найдена</h2>
      <p className="mb-8 text-gray-600 dark:text-gray-400">Запрашиваемая страница не существует или была перемещена</p>
      <Button asChild>
        <Link href="/">Вернуться на главную</Link>
      </Button>
    </div>
  )
}
