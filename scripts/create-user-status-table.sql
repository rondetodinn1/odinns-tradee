-- Создаем таблицу user_status если её нет
CREATE TABLE IF NOT EXISTS user_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL DEFAULT 'Отдыхаю',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id);

-- Включаем RLS
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Создаем политику
CREATE POLICY IF NOT EXISTS "Allow all operations on user_status" ON user_status FOR ALL USING (true) WITH CHECK (true);

COMMIT;
