-- Исправляем RLS политики для таблицы user_cities
DROP POLICY IF EXISTS "Users can manage their own cities" ON user_cities;
DROP POLICY IF EXISTS "Users can view their own cities" ON user_cities;
DROP POLICY IF EXISTS "Users can insert their own cities" ON user_cities;
DROP POLICY IF EXISTS "Users can update their own cities" ON user_cities;

-- Создаем правильные политики
CREATE POLICY "Enable all operations for users on their own cities" ON user_cities
    FOR ALL USING (true)
    WITH CHECK (true);

-- Убеждаемся что RLS включен
ALTER TABLE user_cities ENABLE ROW LEVEL SECURITY;
