-- Создаем таблицу финансовых целей с правильной структурой
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by_username TEXT NOT NULL,
    participants UUID[] DEFAULT ARRAY[]::UUID[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Users can view all goals" ON financial_goals FOR SELECT USING (true);
CREATE POLICY "Users can insert their own goals" ON financial_goals FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own goals" ON financial_goals FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own goals" ON financial_goals FOR DELETE USING (auth.uid() = created_by);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_financial_goals_created_by ON financial_goals(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_created_at ON financial_goals(created_at);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_financial_goals_updated_at 
    BEFORE UPDATE ON financial_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
