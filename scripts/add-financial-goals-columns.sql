-- Добавляем недостающие колонки в таблицу financial_goals
ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'trading';

-- Обновляем существующие записи, если они есть
UPDATE financial_goals 
SET priority = 'medium' 
WHERE priority IS NULL;

UPDATE financial_goals 
SET category = 'trading' 
WHERE category IS NULL;

-- Добавляем комментарии к колонкам
COMMENT ON COLUMN financial_goals.priority IS 'Приоритет цели: low, medium, high';
COMMENT ON COLUMN financial_goals.category IS 'Категория цели: trading, savings, investment, other';
