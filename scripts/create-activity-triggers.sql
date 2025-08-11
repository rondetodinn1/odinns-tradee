-- Создание тригге��ов для автоматической записи активности

-- Функция для записи активности при изменениях в crypto_journal
CREATE OR REPLACE FUNCTION log_crypto_journal_activity()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Получить имя пользователя
    SELECT username INTO username_val FROM users WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            NEW.user_id,
            username_val || ' добавил новую сделку ' || NEW.cryptocurrency || ': ' || 
            CASE WHEN NEW.profit_loss > 0 THEN '+$' ELSE '$' END || NEW.profit_loss::TEXT,
            'success',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            NEW.user_id,
            username_val || ' обновил сделку ' || NEW.cryptocurrency,
            'info',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            OLD.user_id,
            username_val || ' удалил сделку ' || OLD.cryptocurrency,
            'warning',
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция для записи активности при изм��нениях статуса пользователя
CREATE OR REPLACE FUNCTION log_status_activity()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Получить имя пользователя
    SELECT username INTO username_val FROM users WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            NEW.user_id,
            username_val || ' установил статус: ' || NEW.status,
            'info',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            NEW.user_id,
            username_val || ' изменил статус на: ' || NEW.status,
            'info',
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Функция для записи активности при изменениях баланса
CREATE OR REPLACE FUNCTION log_balance_activity()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
    action_text TEXT;
BEGIN
    -- Получить имя пользователя
    SELECT username INTO username_val FROM users WHERE id = NEW.user_id;
    
    -- Определить тип действия
    CASE NEW.type
        WHEN 'deposit' THEN action_text := 'пополнил баланс на $' || NEW.amount::TEXT;
        WHEN 'withdrawal' THEN action_text := 'вывел $' || NEW.amount::TEXT;
        WHEN 'trade_profit' THEN action_text := 'получил прибыль $' || NEW.amount::TEXT;
        WHEN 'trade_loss' THEN action_text := 'понес убыток $' || NEW.amount::TEXT;
        WHEN 'income' THEN action_text := 'получил доход $' || NEW.amount::TEXT;
        WHEN 'expense' THEN action_text := 'потратил $' || NEW.amount::TEXT;
        ELSE action_text := 'изменил баланс на $' || NEW.amount::TEXT;
    END CASE;
    
    INSERT INTO activity_messages (user_id, message, type, created_at)
    VALUES (
        NEW.user_id,
        username_val || ' ' || action_text,
        CASE 
            WHEN NEW.type IN ('deposit', 'trade_profit', 'income') THEN 'success'
            WHEN NEW.type IN ('withdrawal', 'trade_loss', 'expense') THEN 'warning'
            ELSE 'info'
        END,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаление существующих триггеров если они есть
DROP TRIGGER IF EXISTS crypto_journal_activity_trigger ON crypto_journal;
DROP TRIGGER IF EXISTS user_status_activity_trigger ON user_status;
DROP TRIGGER IF EXISTS balance_entries_activity_trigger ON balance_entries;

-- Создание триггеров
CREATE TRIGGER crypto_journal_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON crypto_journal
    FOR EACH ROW EXECUTE FUNCTION log_crypto_journal_activity();

CREATE TRIGGER user_status_activity_trigger
    AFTER INSERT OR UPDATE ON user_status
    FOR EACH ROW EXECUTE FUNCTION log_status_activity();

CREATE TRIGGER balance_entries_activity_trigger
    AFTER INSERT ON balance_entries
    FOR EACH ROW EXECUTE FUNCTION log_balance_activity();

-- Создание триггера для финансовых целей
CREATE OR REPLACE FUNCTION log_financial_goals_activity()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Получить имя пользователя
    SELECT username INTO username_val FROM users WHERE id = COALESCE(NEW.created_by, OLD.created_by);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            NEW.created_by,
            username_val || ' создал новую финансовую цель: ' || NEW.title,
            'success',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            NEW.created_by,
            username_val || ' обновил финансовую цель: ' || NEW.title,
            'info',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_messages (user_id, message, type, created_at)
        VALUES (
            OLD.created_by,
            username_val || ' удалил финансовую цель: ' || OLD.title,
            'warning',
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financial_goals_activity_trigger ON financial_goals;

CREATE TRIGGER financial_goals_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON financial_goals
    FOR EACH ROW EXECUTE FUNCTION log_financial_goals_activity();
