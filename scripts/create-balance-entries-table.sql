-- Создание таблицы для хранения записей баланса
CREATE TABLE IF NOT EXISTS balance_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL, -- deposit, withdrawal, trade_profit, trade_loss, income, expense
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS balance_entries_user_id_idx ON balance_entries(user_id);
CREATE INDEX IF NOT EXISTS balance_entries_type_idx ON balance_entries(type);
CREATE INDEX IF NOT EXISTS balance_entries_created_at_idx ON balance_entries(created_at);

-- Добавление политик безопасности RLS
ALTER TABLE balance_entries ENABLE ROW LEVEL SECURITY;

-- Политика для чтения: пользователи могут видеть только свои записи
CREATE POLICY balance_entries_select_policy ON balance_entries 
  FOR SELECT USING (auth.uid() = user_id);

-- Политика для вставки: пользователи могут добавлять только свои записи
CREATE POLICY balance_entries_insert_policy ON balance_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для обновления: пользователи могут обновлять только свои записи
CREATE POLICY balance_entries_update_policy ON balance_entries 
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика для удаления: пользователи могут удалять только свои записи
CREATE POLICY balance_entries_delete_policy ON balance_entries 
  FOR DELETE USING (auth.uid() = user_id);
