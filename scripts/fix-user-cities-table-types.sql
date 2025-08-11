-- Удаляем старую таблицу если есть проблемы с типами
DROP TABLE IF EXISTS user_cities CASCADE;
DROP TABLE IF EXISTS user_weekly_schedule CASCADE;

-- Создаем таблицу городов с правильными типами
CREATE TABLE user_cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'UA',
    country_name VARCHAR(100) DEFAULT 'Ukraine',
    timezone VARCHAR(50) DEFAULT 'Europe/Kiev',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    CONSTRAINT fk_user_cities_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Создаем таблицу недельного расписания с правильными типами
CREATE TABLE user_weekly_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '18:00:00',
    is_trading_day BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day_of_week),
    CONSTRAINT fk_user_weekly_schedule_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Создаем таблицу для сохранения ежедневной статистики
CREATE TABLE daily_trading_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    total_pnl DECIMAL(15, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    best_trade DECIMAL(15, 2) DEFAULT 0,
    worst_trade DECIMAL(15, 2) DEFAULT 0,
    trading_volume DECIMAL(20, 2) DEFAULT 0,
    trading_time_hours DECIMAL(4, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date),
    CONSTRAINT fk_daily_stats_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- RLS политики
ALTER TABLE user_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trading_stats ENABLE ROW LEVEL SECURITY;

-- Политики для user_cities
CREATE POLICY "Users can view own city" ON user_cities FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can update own city" ON user_cities FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can insert own city" ON user_cities FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can delete own city" ON user_cities FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));

-- Политики для user_weekly_schedule
CREATE POLICY "Users can view own schedule" ON user_weekly_schedule FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can update own schedule" ON user_weekly_schedule FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can insert own schedule" ON user_weekly_schedule FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can delete own schedule" ON user_weekly_schedule FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));

-- Политики для daily_trading_stats
CREATE POLICY "Users can view own stats" ON daily_trading_stats FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can update own stats" ON daily_trading_stats FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));
CREATE POLICY "Users can insert own stats" ON daily_trading_stats FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE username = current_user OR id::text = current_user
));

-- Вставляем данные по умолчанию для существующих пользователей
INSERT INTO user_cities (user_id, city_name, country_code, country_name, timezone) 
SELECT id, 'Киев', 'UA', 'Украина', 'Europe/Kiev' 
FROM users 
WHERE username IN ('RondetOdinn', 'Chadee')
ON CONFLICT (user_id) DO NOTHING;

-- Создаем функцию для автоматического обновления статистики
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем статистику при добавлении/изменении записи в журнале
    INSERT INTO daily_trading_stats (
        user_id, 
        date, 
        total_pnl, 
        total_trades,
        winning_trades,
        losing_trades,
        win_rate,
        best_trade,
        worst_trade,
        trading_volume
    )
    SELECT 
        NEW.user_id,
        DATE(NEW.created_at),
        COALESCE(SUM(profit_loss), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE profit_loss > 0),
        COUNT(*) FILTER (WHERE profit_loss < 0),
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE profit_loss > 0)::DECIMAL / COUNT(*)) * 100
            ELSE 0 
        END,
        COALESCE(MAX(profit_loss), 0),
        COALESCE(MIN(profit_loss), 0),
        COALESCE(SUM(ABS(profit_loss)), 0)
    FROM crypto_journal 
    WHERE user_id = NEW.user_id 
    AND DATE(created_at) = DATE(NEW.created_at)
    AND trade_type = 'trade'
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_pnl = EXCLUDED.total_pnl,
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        win_rate = EXCLUDED.win_rate,
        best_trade = EXCLUDED.best_trade,
        worst_trade = EXCLUDED.worst_trade,
        trading_volume = EXCLUDED.trading_volume,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления статистики
DROP TRIGGER IF EXISTS trigger_update_daily_stats ON crypto_journal;
CREATE TRIGGER trigger_update_daily_stats
    AFTER INSERT OR UPDATE ON crypto_journal
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_stats();
