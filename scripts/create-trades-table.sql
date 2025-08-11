-- Создание таблицы для хранения сделок
CREATE TABLE IF NOT EXISTS crypto_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cryptocurrency TEXT NOT NULL,
  entry_point TEXT NOT NULL,
  exit_point TEXT,
  details TEXT,
  profit_loss DECIMAL,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS crypto_journal_user_id_idx ON crypto_journal(user_id);
CREATE INDEX IF NOT EXISTS crypto_journal_cryptocurrency_idx ON crypto_journal(cryptocurrency);
CREATE INDEX IF NOT EXISTS crypto_journal_created_at_idx ON crypto_journal(created_at);

-- Добавление политик безопасности RLS
ALTER TABLE crypto_journal ENABLE ROW LEVEL SECURITY;

-- Политика для чтения: пользователи могут видеть только свои записи
CREATE POLICY crypto_journal_select_policy ON crypto_journal 
  FOR SELECT USING (auth.uid() = user_id);

-- Политика для вставки: пользователи могут добавлять только свои записи
CREATE POLICY crypto_journal_insert_policy ON crypto_journal 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для обновления: пользователи могут обновлять только свои записи
CREATE POLICY crypto_journal_update_policy ON crypto_journal 
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика для удаления: пользователи могут удалять только свои записи
CREATE POLICY crypto_journal_delete_policy ON crypto_journal 
  FOR DELETE USING (auth.uid() = user_id);
