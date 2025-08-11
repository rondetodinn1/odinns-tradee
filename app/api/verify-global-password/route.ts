import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    console.log("=== ПРОВЕРКА ГЛОБАЛЬНОГО ПАРОЛЯ ===")
    console.log("Полученный пароль:", password)

    if (!password) {
      console.log("❌ Пароль не предоставлен")
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Получаем глобальный пароль из БД
    const { data: setting, error } = await supabase
      .from("global_settings")
      .select("setting_value")
      .eq("setting_key", "global_password")
      .single()

    if (error) {
      console.error("❌ Ошибка получения пароля из БД:", error)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    if (!setting) {
      console.error("❌ Глобальный пароль не найден в БД")
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 })
    }

    console.log("Пароль из БД:", setting.setting_value)
    console.log("Введенный пароль:", password.trim())

    const isValid = setting.setting_value === password.trim()
    console.log("Результат сравнения:", isValid)

    return NextResponse.json({ success: isValid })
  } catch (error) {
    console.error("❌ Ошибка проверки глобального пароля:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
