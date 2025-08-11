-- Создание таблицы финансовых целей
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by_username TEXT NOT NULL,
    participants UUID[] DEFAULT ARRAY[]::UUID[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_financial_goals_created_by ON financial_goals(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_target_date ON financial_goals(target_date);

-- Включение RLS
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Политики RLS
CREATE POLICY "Users can view all financial goals" ON financial_goals
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own financial goals" ON financial_goals
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own financial goals" ON financial_goals
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own financial goals" ON financial_goals
    FOR DELETE USING (auth.uid() = created_by);
