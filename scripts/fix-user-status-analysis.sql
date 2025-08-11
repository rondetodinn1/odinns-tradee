-- Проверяем и исправляем статусы пользователей
-- Убеждаемся что все статусы корректные
UPDATE user_status 
SET status = 'Отдыхаю' 
WHERE status IS NULL OR status = '' OR status = 'online';

-- Проверяем что таблица user_status имеет правильную структуру
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'user_status';

-- Если нужно, увеличиваем длину поля status
ALTER TABLE user_status 
ALTER COLUMN status TYPE VARCHAR(50);

-- Добавляем индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_user_status_user_id 
ON user_status(user_id);
