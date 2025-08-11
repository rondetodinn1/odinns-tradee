-- Создаем таблицу для хранения API ключей Gemini
CREATE TABLE IF NOT EXISTS gemini_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для быстрого поиска
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

-- Вставляем дефолтные ключи для существующих пользователей
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
ON CONFLICT DO NOTHING;

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_gemini_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_gemini_api_keys_updated_at
    BEFORE UPDATE ON gemini_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_gemini_api_keys_updated_at();
