-- Проверяем структуру таблицы balance_entries
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'balance_entries';

-- Если нужно, добавляем недостающие колонки
ALTER TABLE balance_entries 
ADD COLUMN IF NOT EXISTS balance DECIMAL(20,2) DEFAULT 0;

-- Обновляем существующие записи
UPDATE balance_entries 
SET balance = amount 
WHERE balance IS NULL;
