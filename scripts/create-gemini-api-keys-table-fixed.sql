-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Users can view own API keys" ON gemini_api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON gemini_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON gemini_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON gemini_api_keys;

-- Создаем таблицу для хранения API ключей Gemini
CREATE TABLE IF NOT EXISTS gemini_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_user_id ON gemini_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_active ON gemini_api_keys(user_id, is_active);

-- Включаем RLS
ALTER TABLE gemini_api_keys ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Users can view own API keys" ON gemini_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON gemini_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON gemini_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON gemini_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Вставляем дефолтные ключи
INSERT INTO gemini_api_keys (user_id, api_key, is_active)
SELECT 
    id,
    CASE 
        WHEN username = 'RondetOdinn' THEN 'AIzaSyAn_BAOXeWEJ_LhFs5jdYVqj6ivEi1LMME'
        WHEN username = 'Chadee' THEN 'AIzaSyAXKtPn7uYodyWzil94Sax9DBb3yILR3iU'
        ELSE NULL
    END,
    true
FROM users 
WHERE username IN ('RondetOdinn', 'Chadee')
  AND NOT EXISTS (SELECT 1 FROM gemini_api_keys WHERE user_id = users.id);
