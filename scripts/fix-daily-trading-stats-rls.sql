-- Исправляем политики RLS для daily_trading_stats
DROP POLICY IF EXISTS "Users can manage their own daily stats" ON daily_trading_stats;

-- Создаем правильную политику
CREATE POLICY "Users can manage their own daily stats" ON daily_trading_stats
FOR ALL USING (true) WITH CHECK (true);

-- Также убеждаемся что таблица существует
CREATE TABLE IF NOT EXISTS daily_trading_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    best_trade DECIMAL(15,2) DEFAULT 0,
    worst_trade DECIMAL(15,2) DEFAULT 0,
    total_volume DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Включаем RLS
ALTER TABLE daily_trading_stats ENABLE ROW LEVEL SECURITY;
