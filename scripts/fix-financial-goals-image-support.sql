-- Добавление поддержки изображений в финансовые цели

-- Добавляем колонку для URL изображения цели
ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Добавляем комментарий к колонке
COMMENT ON COLUMN financial_goals.image_url IS 'URL изображения для визуализации финансовой цели';

-- Добавляем колонку для категории цели
ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- Добавляем комментарий к колонке категории
COMMENT ON COLUMN financial_goals.category IS 'Категория финансовой цели (trading, investment, savings, etc.)';

-- Добавляем ограничение для валидных категорий
ALTER TABLE financial_goals 
ADD CONSTRAINT check_goal_category 
CHECK (category IN ('trading', 'investment', 'savings', 'education', 'travel', 'business', 'general'));

-- Добавляем колонку для приоритета цели
ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Добавляем комментарий к колонке приоритета
COMMENT ON COLUMN financial_goals.priority IS 'Приоритет цели (1 - высокий, 2 - средний, 3 - низкий)';

-- Добавляем ограничение для приоритета
ALTER TABLE financial_goals 
ADD CONSTRAINT check_goal_priority 
CHECK (priority IN (1, 2, 3));

-- Добавляем колонку для прогресса в процентах
ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0;

-- Добавляем комментарий к колонке прогресса
COMMENT ON COLUMN financial_goals.progress_percentage IS 'Прогресс достижения цели в процентах';

-- Добавляем колонку для заметок
ALTER TABLE financial_goals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Добавляем комментарий к колонке заметок
COMMENT ON COLUMN financial_goals.notes IS 'Дополнительные заметки к финансовой цели';

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_financial_goals_category 
ON financial_goals(category);

CREATE INDEX IF NOT EXISTS idx_financial_goals_priority 
ON financial_goals(priority);

CREATE INDEX IF NOT EXISTS idx_financial_goals_status 
ON financial_goals(status);

-- Функция для автоматического расчета прогресса
CREATE OR REPLACE FUNCTION calculate_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Рассчитываем прогресс в процентах
    IF NEW.target_amount > 0 THEN
        NEW.progress_percentage = ROUND((NEW.current_amount / NEW.target_amount) * 100, 2);
        
        -- Ограничиваем прогресс максимумом 100%
        IF NEW.progress_percentage > 100 THEN
            NEW.progress_percentage = 100;
        END IF;
        
        -- Автоматически меняем статус на completed если достигли 100%
        IF NEW.progress_percentage >= 100 AND NEW.status = 'active' THEN
            NEW.status = 'completed';
        END IF;
    ELSE
        NEW.progress_percentage = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического расчета прогресса
DROP TRIGGER IF EXISTS trigger_calculate_goal_progress ON financial_goals;
CREATE TRIGGER trigger_calculate_goal_progress
    BEFORE INSERT OR UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION calculate_goal_progress();

-- Обновляем прогресс для существующих целей
UPDATE financial_goals 
SET progress_percentage = CASE 
    WHEN target_amount > 0 THEN 
        LEAST(ROUND((current_amount / target_amount) * 100, 2), 100)
    ELSE 0 
END;

-- Обновляем статус завершенных целей
UPDATE financial_goals 
SET status = 'completed' 
WHERE progress_percentage >= 100 AND status = 'active';

-- Обновляем категории для существующих целей
UPDATE financial_goals 
SET category = 'trading' 
WHERE title ILIKE '%торг%' OR title ILIKE '%trade%' OR description ILIKE '%торг%';

UPDATE financial_goals 
SET category = 'savings' 
WHERE title ILIKE '%накоп%' OR title ILIKE '%сбер%' OR description ILIKE '%накоп%';

COMMIT;
