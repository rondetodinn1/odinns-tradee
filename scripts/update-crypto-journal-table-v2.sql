-- Обновляем таблицу crypto_journal для поддержки типов операций
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'trade';

-- Обновляем существующие записи
UPDATE crypto_journal 
SET trade_type = 'trade' 
WHERE trade_type IS NULL;

-- Добавляем ограничение на типы операций
ALTER TABLE crypto_journal 
ADD CONSTRAINT check_trade_type 
CHECK (trade_type IN ('trade', 'deposit', 'withdrawal', 'income', 'expense', 'investment', 'dividend', 'bonus', 'fee', 'transfer'));
