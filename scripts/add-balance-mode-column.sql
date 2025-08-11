-- Добавляем колонку для закрепления сделок
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- Обновляем существующие записи
UPDATE crypto_journal 
SET pinned = FALSE 
WHERE pinned IS NULL;

-- Добавляем комментарий к полю
COMMENT ON COLUMN crypto_journal.pinned IS 'Закреплена ли сделка наверху списка';

-- Создаем индекс для быстрого поиска закрепленных сделок
CREATE INDEX IF NOT EXISTS idx_crypto_journal_pinned 
ON crypto_journal(pinned, created_at DESC);

-- Проверяем что колонка добавилась
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'crypto_journal' 
AND column_name = 'pinned';
