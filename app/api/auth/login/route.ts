import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log("=== API LOGIN ATTEMPT ===")
    console.log("Username:", username)

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Введите имя пользователя и пароль" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Получаем пользователя из базы данных
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .single()

    if (userError || !userData) {
      console.error("User not found:", userError)
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 })
    }

    console.log("User found:", userData.username)

    // Проверяем пароль (простая проверка для демо)
    if (userData.password_hash !== password.trim()) {
      console.error("Invalid password")
      return NextResponse.json({ success: false, error: "Неверный пароль" }, { status: 401 })
    }

    // Обновляем время последнего входа
    const { error: updateError } = await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.id)

    if (updateError) {
      console.warn("Failed to update last login:", updateError)
    }

    console.log("✅ Login successful for user:", userData.username)

    // Возвращаем успешный ответ с данными пользователя
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar_url: userData.avatar_url,
        created_at: userData.created_at,
        last_login: userData.last_login,
      },
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
