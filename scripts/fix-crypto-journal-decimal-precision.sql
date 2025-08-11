-- Исправление точности десятичных чисел в crypto_journal
-- Сначала удаляем представления, которые зависят от этой колонки

-- Удаляем представления
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS user_balances CASCADE;

-- Изменяем тип колонки profit_loss для большей точности
ALTER TABLE crypto_journal 
ALTER COLUMN profit_loss TYPE DECIMAL(20,10);

-- Изменяем тип колонки entry_point для большей точности
ALTER TABLE crypto_journal 
ALTER COLUMN entry_point TYPE DECIMAL(20,10);

-- Изменяем тип колонки exit_point для большей точности
ALTER TABLE crypto_journal 
ALTER COLUMN exit_point TYPE DECIMAL(20,10);

-- Изменяем тип колонки quantity для большей точности
ALTER TABLE crypto_journal 
ALTER COLUMN quantity TYPE DECIMAL(20,10);

-- Пересоздаем представление user_stats с новыми типами
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    COUNT(cj.id) as total_trades,
    COALESCE(SUM(cj.profit_loss), 0) as total_pnl,
    COALESCE(AVG(cj.profit_loss), 0) as avg_pnl,
    COUNT(CASE WHEN cj.profit_loss > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN cj.profit_loss < 0 THEN 1 END) as losing_trades,
    CASE 
        WHEN COUNT(cj.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN cj.profit_loss > 0 THEN 1 END)::DECIMAL / COUNT(cj.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as win_rate
FROM users u
LEFT JOIN crypto_journal cj ON u.id = cj.user_id AND cj.trade_type = 'trade'
GROUP BY u.id, u.username, u.full_name;

-- Пересоздаем представление user_balances
CREATE VIEW user_balances AS
SELECT 
    u.id,
    u.username,
    COALESCE(SUM(CASE WHEN be.type IN ('deposit', 'income') THEN be.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN be.type IN ('withdrawal', 'expense') THEN be.amount ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN cj.trade_type = 'trade' THEN cj.profit_loss ELSE 0 END), 0) as current_balance,
    COALESCE(SUM(CASE WHEN be.type IN ('deposit', 'income') THEN be.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN be.type IN ('withdrawal', 'expense') THEN be.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN cj.trade_type = 'trade' THEN cj.profit_loss ELSE 0 END), 0) as trading_pnl
FROM users u
LEFT JOIN balance_entries be ON u.id = be.user_id
LEFT JOIN crypto_journal cj ON u.id = cj.user_id
GROUP BY u.id, u.username;

COMMIT;
