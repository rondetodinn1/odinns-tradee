-- Проверяем структуру колонки avatar_url в таблице users
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';

-- Проверяем текущие аватары пользователей
SELECT id, username, 
       CASE 
         WHEN avatar_url IS NULL THEN 'NULL'
         WHEN avatar_url = '' THEN 'EMPTY'
         WHEN avatar_url LIKE 'data:image%' THEN 'BASE64 (' || LENGTH(avatar_url) || ' chars)'
         ELSE 'OTHER: ' || LEFT(avatar_url, 50) || '...'
       END as avatar_status,
       updated_at
FROM users 
ORDER BY updated_at DESC;
