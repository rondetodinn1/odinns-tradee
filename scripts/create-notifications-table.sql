-- Создание таблицы для хранения уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- info, warning, success, error
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Добавление политик безопасности RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политика для чтения: пользователи могут видеть только свои уведомления
CREATE POLICY notifications_select_policy ON notifications 
  FOR SELECT USING (auth.uid() = user_id);

-- Политика для вставки: пользователи могут добавлять только свои уведомления
CREATE POLICY notifications_insert_policy ON notifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для обновления: пользователи могут обновлять только свои уведомления
CREATE POLICY notifications_update_policy ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика для удаления: пользователи могут удалять только свои уведомления
CREATE POLICY notifications_delete_policy ON notifications 
  FOR DELETE USING (auth.uid() = user_id);
