-- Создание таблицы для хранения сообщений активности
CREATE TABLE IF NOT EXISTS activity_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- info, warning, success, error
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS activity_messages_user_id_idx ON activity_messages(user_id);
CREATE INDEX IF NOT EXISTS activity_messages_is_read_idx ON activity_messages(is_read);
CREATE INDEX IF NOT EXISTS activity_messages_created_at_idx ON activity_messages(created_at);

-- Добавление политик безопасности RLS
ALTER TABLE activity_messages ENABLE ROW LEVEL SECURITY;

-- Политика для чтения: пользователи могут видеть только свои сообщения
CREATE POLICY activity_messages_select_policy ON activity_messages 
  FOR SELECT USING (auth.uid() = user_id);

-- Политика для вставки: пользователи могут добавлять только свои сообщения
CREATE POLICY activity_messages_insert_policy ON activity_messages 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для обновления: пользователи могут обновлять только свои сообщения
CREATE POLICY activity_messages_update_policy ON activity_messages 
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика для удаления: пользователи могут удалять только свои сообщения
CREATE POLICY activity_messages_delete_policy ON activity_messages 
  FOR DELETE USING (auth.uid() = user_id);
