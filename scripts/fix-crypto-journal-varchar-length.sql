-- Исправляем длину поля trade_type в таблице crypto_journal
ALTER TABLE crypto_journal 
ALTER COLUMN trade_type TYPE VARCHAR(50);

-- Проверяем что поле cryptocurrency тоже достаточно длинное
ALTER TABLE crypto_journal 
ALTER COLUMN cryptocurrency TYPE VARCHAR(50);

-- Проверяем что поле details достаточно длинное
ALTER TABLE crypto_journal 
ALTER COLUMN details TYPE TEXT;

-- Добавляем недостающие типы операций если их нет
UPDATE crypto_journal 
SET trade_type = 'trade' 
WHERE trade_type IS NULL OR trade_type = '';

-- Добавляем комментарий к полю
COMMENT ON COLUMN crypto_journal.trade_type IS 'Тип операции: trade, income, expense, card_withdrawal, wallet_withdrawal';

-- Проверяем структуру таблицы
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'crypto_journal' 
AND column_name IN ('trade_type', 'cryptocurrency', 'details');
