-- Исправление таблицы financial_goals с очисткой существующих политик

-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Users can view all goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON financial_goals;
DROP POLICY IF EXISTS "Anonymous can view goals" ON financial_goals;
DROP POLICY IF EXISTS "Anonymous can insert goals" ON financial_goals;
DROP POLICY IF EXISTS "Anonymous can update goals" ON financial_goals;
DROP POLICY IF EXISTS "Anonymous can delete goals" ON financial_goals;

-- Удаляем таблицу если существует
DROP TABLE IF EXISTS financial_goals CASCADE;

-- Создаем таблицу заново
CREATE TABLE financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    created_by UUID NOT NULL,
    created_by_username VARCHAR(50) NOT NULL,
    participants UUID[] DEFAULT ARRAY[]::UUID[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Создаем индексы для производительности
CREATE INDEX idx_financial_goals_created_by ON financial_goals(created_by);
CREATE INDEX idx_financial_goals_status ON financial_goals(status);
CREATE INDEX idx_financial_goals_target_date ON financial_goals(target_date);
CREATE INDEX idx_financial_goals_created_at ON financial_goals(created_at);

-- Создаем новые политики для анонимного доступа (временно для разработки)
CREATE POLICY "Allow all operations for development" ON financial_goals
    FOR ALL USING (true) WITH CHECK (true);

-- Создаем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_financial_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_goals_updated_at();

-- Добавляем тестовые данные для проверки
INSERT INTO financial_goals (
    title,
    description,
    target_amount,
    current_amount,
    target_date,
    created_by,
    created_by_username,
    participants,
    status
) VALUES 
(
    'Достичь $1000 прибыли',
    'Цель заработать первую тысячу долларов на торговле криптовалютами',
    1000.00,
    250.00,
    '2024-12-31',
    '00000000-0000-0000-0000-000000000001',
    'RondetOdinn',
    ARRAY['00000000-0000-0000-0000-000000000001']::UUID[],
    'active'
),
(
    'Накопить на новый компьютер',
    'Собрать $2500 на покупку нового игрового компьютера',
    2500.00,
    800.00,
    '2025-03-15',
    '00000000-0000-0000-0000-000000000002',
    'Chadee',
    ARRAY['00000000-0000-0000-0000-000000000002']::UUID[],
    'active'
),
(
    'Отпуск в Японии',
    'Накопить деньги на поездку в Японию на 2 недели',
    5000.00,
    1200.00,
    '2025-06-01',
    '00000000-0000-0000-0000-000000000001',
    'RondetOdinn',
    ARRAY['00000000-0000-0000-0000-000000000001']::UUID[],
    'active'
);

COMMIT;
