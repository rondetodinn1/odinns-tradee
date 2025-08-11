-- Создание RLS политик для всех таблиц
-- Сначала включаем RLS для всех таблиц

-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

DROP POLICY IF EXISTS "Users can view own status" ON user_status;
DROP POLICY IF EXISTS "Users can update own status" ON user_status;
DROP POLICY IF EXISTS "Users can insert own status" ON user_status;

DROP POLICY IF EXISTS "Users can view own schedule" ON work_schedule;
DROP POLICY IF EXISTS "Users can update own schedule" ON work_schedule;
DROP POLICY IF EXISTS "Users can insert own schedule" ON work_schedule;

DROP POLICY IF EXISTS "Users can view own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON financial_goals;

DROP POLICY IF EXISTS "Users can view own journal" ON crypto_journal;
DROP POLICY IF EXISTS "Users can update own journal" ON crypto_journal;
DROP POLICY IF EXISTS "Users can insert own journal" ON crypto_journal;
DROP POLICY IF EXISTS "Users can delete own journal" ON crypto_journal;

DROP POLICY IF EXISTS "Users can view own balance" ON balance_entries;
DROP POLICY IF EXISTS "Users can insert own balance" ON balance_entries;

DROP POLICY IF EXISTS "Users can view all activity" ON activity_messages;
DROP POLICY IF EXISTS "Users can insert activity" ON activity_messages;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON user_api_keys;

-- Создаем новые политики

-- Политики для таблицы users
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Политики для таблицы user_status
CREATE POLICY "Users can view all statuses" ON user_status
    FOR SELECT USING (true);

CREATE POLICY "Users can update own status" ON user_status
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own status" ON user_status
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Политики для таблицы work_schedule
CREATE POLICY "Users can view all schedules" ON work_schedule
    FOR SELECT USING (true);

CREATE POLICY "Users can update own schedule" ON work_schedule
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own schedule" ON work_schedule
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Политики для таблицы financial_goals
CREATE POLICY "Users can view all goals" ON financial_goals
    FOR SELECT USING (true);

CREATE POLICY "Users can update own goals" ON financial_goals
    FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.uid()::text = created_by::text);

CREATE POLICY "Users can insert goals" ON financial_goals
    FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

-- Политики для таблицы crypto_journal
CREATE POLICY "Users can view own journal" ON crypto_journal
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own journal" ON crypto_journal
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own journal" ON crypto_journal
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own journal" ON crypto_journal
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Политики для таблицы balance_entries
CREATE POLICY "Users can view own balance" ON balance_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own balance" ON balance_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Политики для таблицы activity_messages (все могут видеть и добавлять)
CREATE POLICY "Users can view all activity" ON activity_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert activity" ON activity_messages
    FOR INSERT WITH CHECK (true);

-- Политики для таблицы notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Политики для таблицы user_api_keys
CREATE POLICY "Users can view own api keys" ON user_api_keys
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own api keys" ON user_api_keys
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own api keys" ON user_api_keys
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Дополнительные политики для анонимного доступа (если нужно)
-- Временно разрешаем все операции для анонимных пользователей

-- Политики для анонимного доступа к activity_messages
CREATE POLICY "Anonymous can view activity" ON activity_messages
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert activity" ON activity_messages
    FOR INSERT WITH CHECK (true);

-- Политики для анонимного доступа к users
CREATE POLICY "Anonymous can view users" ON users
    FOR SELECT USING (true);

-- Политики для анонимного доступа к crypto_journal
CREATE POLICY "Anonymous can view journal" ON crypto_journal
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert journal" ON crypto_journal
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can update journal" ON crypto_journal
    FOR UPDATE USING (true);

CREATE POLICY "Anonymous can delete journal" ON crypto_journal
    FOR DELETE USING (true);

-- Политики для анонимного доступа к balance_entries
CREATE POLICY "Anonymous can view balance" ON balance_entries
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert balance" ON balance_entries
    FOR INSERT WITH CHECK (true);

-- Политики для анонимного доступа к notifications
CREATE POLICY "Anonymous can view notifications" ON notifications
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can update notifications" ON notifications
    FOR UPDATE USING (true);

-- Политики для анонимного доступа к financial_goals
CREATE POLICY "Anonymous can view goals" ON financial_goals
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert goals" ON financial_goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can update goals" ON financial_goals
    FOR UPDATE USING (true);

-- Политики для анонимного доступа к user_status
CREATE POLICY "Anonymous can view status" ON user_status
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert status" ON user_status
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can update status" ON user_status
    FOR UPDATE USING (true);

-- Политики для анонимного доступа к work_schedule
CREATE POLICY "Anonymous can view schedule" ON work_schedule
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert schedule" ON work_schedule
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can update schedule" ON work_schedule
    FOR UPDATE USING (true);

-- Политики для анонимного доступа к user_api_keys
CREATE POLICY "Anonymous can view api keys" ON user_api_keys
    FOR SELECT USING (true);

CREATE POLICY "Anonymous can insert api keys" ON user_api_keys
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can update api keys" ON user_api_keys
    FOR UPDATE USING (true);

COMMIT;
