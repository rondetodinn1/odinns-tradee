-- Создание таблицы городов
CREATE TABLE IF NOT EXISTS user_cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Создание таблицы расписания на неделю
CREATE TABLE IF NOT EXISTS user_weekly_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Воскресенье, 6 = Суббота
    start_time TIME,
    end_time TIME,
    is_trading_day BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day_of_week)
);

-- Вставка городов по умолчанию
INSERT INTO user_cities (user_id, city_name, country_code, timezone) 
SELECT id, 'Киев', 'UA', 'Europe/Kiev' 
FROM users 
WHERE username IN ('RondetOdinn', 'Chadee')
ON CONFLICT (user_id) DO NOTHING;

-- RLS политики
ALTER TABLE user_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own city" ON user_cities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own city" ON user_cities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own city" ON user_cities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own schedule" ON user_weekly_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON user_weekly_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule" ON user_weekly_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON user_weekly_schedule FOR DELETE USING (auth.uid() = user_id);
