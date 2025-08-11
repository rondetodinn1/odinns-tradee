-- Обновление таблицы crypto_journal для добавления поля screenshot_url
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Обновление существующих записей
UPDATE crypto_journal 
SET screenshot_url = NULL 
WHERE screenshot_url IS NULL;

-- Добавление комментария к полю
COMMENT ON COLUMN crypto_journal.screenshot_url IS 'URL скриншота сделки';
