-- Добавление типа позиции (лонг/шорт) в crypto_journal

-- Добавляем колонку для типа позиции
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS position_type VARCHAR(10) DEFAULT 'long';

-- Добавляем комментарий к колонке
COMMENT ON COLUMN crypto_journal.position_type IS 'Тип позиции: long (лонг) или short (шорт)';

-- Добавляем ограничение для валидных значений
ALTER TABLE crypto_journal 
ADD CONSTRAINT check_position_type 
CHECK (position_type IN ('long', 'short'));

-- Обновляем существующие записи (по умолчанию лонг)
UPDATE crypto_journal 
SET position_type = 'long' 
WHERE position_type IS NULL;

-- Добавляем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_crypto_journal_position_type 
ON crypto_journal(position_type);

-- Добавляем колонку для ROI (Return on Investment)
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS roi DECIMAL(10,4) DEFAULT 0;

-- Добавляем комментарий к колонке ROI
COMMENT ON COLUMN crypto_journal.roi IS 'Доходность инвестиций в процентах';

-- Добавляем колонку для закрепления записи
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- Добавляем комментарий к колонке pinned
COMMENT ON COLUMN crypto_journal.pinned IS 'Закреплена ли запись в топе списка';

-- Добавляем индекс для закрепленных записей
CREATE INDEX IF NOT EXISTS idx_crypto_journal_pinned 
ON crypto_journal(pinned) WHERE pinned = TRUE;

-- Функция для автоматического расчета ROI
CREATE OR REPLACE FUNCTION calculate_roi()
RETURNS TRIGGER AS $$
BEGIN
    -- Рассчитываем ROI только если есть entry_point и profit_loss
    IF NEW.entry_point IS NOT NULL AND NEW.entry_point > 0 AND NEW.quantity IS NOT NULL AND NEW.quantity > 0 THEN
        NEW.roi = ROUND(((NEW.profit_loss / (NEW.entry_point * NEW.quantity)) * 100), 4);
    ELSE
        NEW.roi = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического расчета ROI
DROP TRIGGER IF EXISTS trigger_calculate_roi ON crypto_journal;
CREATE TRIGGER trigger_calculate_roi
    BEFORE INSERT OR UPDATE ON crypto_journal
    FOR EACH ROW
    EXECUTE FUNCTION calculate_roi();

-- Обновляем ROI для существующих записей
UPDATE crypto_journal 
SET roi = CASE 
    WHEN entry_point > 0 AND quantity > 0 THEN 
        ROUND(((profit_loss / (entry_point * quantity)) * 100), 4)
    ELSE 0 
END
WHERE entry_point IS NOT NULL AND quantity IS NOT NULL;

COMMIT;
