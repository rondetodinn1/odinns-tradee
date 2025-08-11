import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔄 Получаем курс USD/UAH через серверный API...")

    // Пробуем первый источник - ExchangeRate-API
    try {
      console.log("Пробуем источник: https://api.exchangerate-api.com/v4/latest/USD")
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoApp/1.0)",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const uahRate = data.rates?.UAH

        if (uahRate && typeof uahRate === "number" && uahRate > 0) {
          console.log("✅ Успешно получен курс:", uahRate, "UAH за 1 USD")
          return NextResponse.json({
            success: true,
            rate: uahRate,
            source: "ExchangeRate-API",
            timestamp: new Date().toISOString(),
          })
        }
      }
    } catch (error) {
      console.warn("ExchangeRate-API failed:", error)
    }

    // Пробуем второй источник - Open Exchange Rates
    try {
      console.log("Пробуем источник: https://open.er-api.com/v6/latest/USD")
      const response = await fetch("https://open.er-api.com/v6/latest/USD", {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoApp/1.0)",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const uahRate = data.rates?.UAH

        if (uahRate && typeof uahRate === "number" && uahRate > 0) {
          console.log("✅ Успешно получен курс:", uahRate, "UAH за 1 USD")
          return NextResponse.json({
            success: true,
            rate: uahRate,
            source: "Open Exchange Rates",
            timestamp: new Date().toISOString(),
          })
        }
      }
    } catch (error) {
      console.warn("Open Exchange Rates failed:", error)
    }

    // Пробуем третий источник - Fixer.io (бес��латный план)
    try {
      console.log("Пробуем источник: http://data.fixer.io/api/latest")
      const response = await fetch("http://data.fixer.io/api/latest?access_key=YOUR_FREE_KEY&base=USD&symbols=UAH", {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoApp/1.0)",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const uahRate = data.rates?.UAH

        if (uahRate && typeof uahRate === "number" && uahRate > 0) {
          console.log("✅ Успешно получен курс:", uahRate, "UAH за 1 USD")
          return NextResponse.json({
            success: true,
            rate: uahRate,
            source: "Fixer.io",
            timestamp: new Date().toISOString(),
          })
        }
      }
    } catch (error) {
      console.warn("Fixer.io failed:", error)
    }

    // Если все источники недоступны, возвращаем fallback
    console.log("⚠️ Все источники недоступны, используем fallback курс")
    return NextResponse.json({
      success: false,
      rate: 41.5,
      source: "Fallback",
      timestamp: new Date().toISOString(),
      warning: "Все внешние источники недоступны, используется резервный курс",
    })
  } catch (error) {
    console.error("❌ Ошибка в API exchange-rate:", error)
    return NextResponse.json({
      success: false,
      rate: 41.5,
      source: "Error Fallback",
      timestamp: new Date().toISOString(),
      warning: "Ошибка сервера при получении курса",
    })
  }
}
