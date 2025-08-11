-- Создаем функцию для вычисления баланса пользователя
CREATE OR REPLACE FUNCTION calculate_user_balance(user_uuid UUID)
RETURNS DECIMAL(20,2) AS $$
DECLARE
    total_balance DECIMAL(20,2) := 0;
BEGIN
    SELECT COALESCE(
        SUM(CASE 
            WHEN type IN ('deposit', 'trade_profit', 'income') THEN amount
            WHEN type IN ('withdrawal', 'trade_loss', 'expense') THEN -amount
            ELSE 0
        END), 0
    ) INTO total_balance
    FROM balance_entries
    WHERE user_id = user_uuid;
    
    RETURN total_balance;
END;
$$ LANGUAGE plpgsql;

-- Обновляем баланс в таблице users
UPDATE users 
SET balance = calculate_user_balance(id);

-- Создаем триггер для автоматического обновления баланса
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE users 
        SET balance = calculate_user_balance(NEW.user_id)
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET balance = calculate_user_balance(OLD.user_id)
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
DROP TRIGGER IF EXISTS balance_update_trigger ON balance_entries;
CREATE TRIGGER balance_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON balance_entries
    FOR EACH ROW EXECUTE FUNCTION update_user_balance();
