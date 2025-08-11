-- Увеличиваем размер колонки avatar_url для base64 изображений
ALTER TABLE users 
ALTER COLUMN avatar_url TYPE TEXT;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(id) WHERE avatar_url IS NOT NULL;

COMMIT;
