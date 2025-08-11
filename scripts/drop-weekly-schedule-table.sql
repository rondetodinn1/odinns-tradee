-- Удаление таблицы недельного расписания
DROP TABLE IF EXISTS user_weekly_schedule;

-- Удаление связанных политик RLS (если они существуют)
DROP POLICY IF EXISTS "Users can view own weekly schedule" ON user_weekly_schedule;
DROP POLICY IF EXISTS "Users can insert own weekly schedule" ON user_weekly_schedule;
DROP POLICY IF EXISTS "Users can update own weekly schedule" ON user_weekly_schedule;
DROP POLICY IF EXISTS "Users can delete own weekly schedule" ON user_weekly_schedule;

-- Подтверждение удаления
SELECT 'Weekly schedule table and policies dropped successfully' as result;
