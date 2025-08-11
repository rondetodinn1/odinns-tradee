-- Полная схема базы данных для ODINNS Platform
-- Удаляем существующие таблицы если они есть (осторожно!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_messages CASCADE;
DROP TABLE IF EXISTS balance_entries CASCADE;
DROP TABLE IF EXISTS crypto_journal CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;
DROP TABLE IF EXISTS user_api_keys CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Создание таблицы пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Соз��ание таблицы статусов пользователей
CREATE TABLE user_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Создание таблицы для криптожурнала
CREATE TABLE crypto_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cryptocurrency VARCHAR(20) NOT NULL,
  entry_point DECIMAL(20,8) NOT NULL,
  exit_point DECIMAL(20,8),
  quantity DECIMAL(20,8),
  details TEXT,
  profit_loss DECIMAL(20,2),
  screenshot_url TEXT,
  trade_type VARCHAR(10) DEFAULT 'buy', -- buy, sell
  status VARCHAR(20) DEFAULT 'open', -- open, closed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы записей баланса
CREATE TABLE balance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- deposit, withdrawal, trade_profit, trade_loss, income, expense
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы сообщений активности
CREATE TABLE activity_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, success, error
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы уведомлений
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, success, error
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы API ключей пользователей
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name VARCHAR(50) NOT NULL, -- binance, coinbase, etc
  api_key TEXT NOT NULL,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_status_user_id ON user_status(user_id);
CREATE INDEX idx_crypto_journal_user_id ON crypto_journal(user_id);
CREATE INDEX idx_crypto_journal_cryptocurrency ON crypto_journal(cryptocurrency);
CREATE INDEX idx_crypto_journal_created_at ON crypto_journal(created_at);
CREATE INDEX idx_balance_entries_user_id ON balance_entries(user_id);
CREATE INDEX idx_balance_entries_type ON balance_entries(type);
CREATE INDEX idx_balance_entries_created_at ON balance_entries(created_at);
CREATE INDEX idx_activity_messages_user_id ON activity_messages(user_id);
CREATE INDEX idx_activity_messages_is_read ON activity_messages(is_read);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);

-- Вставка пользователей
INSERT INTO users (username, password_hash, email, full_name, role) VALUES 
('RondetOdinn', 'Rop123456789mopik!', 'rondet@odinns.com', 'Rondet Odinn', 'admin'),
('Chadee', '1234', 'chadee@odinns.com', 'Chadee', 'user');

-- Вставка начальных статусов
INSERT INTO user_status (user_id, status) 
SELECT id, 'online' FROM users WHERE username IN ('RondetOdinn', 'Chadee');

-- Вставка приветственных уведомлений
INSERT INTO notifications (user_id, title, message, type)
SELECT id, 'Добро пожаловать!', 'Добро пожаловать в ODINNS Platform! Начните торговать и отслеживать свои результаты.', 'success'
FROM users WHERE username IN ('RondetOdinn', 'Chadee');

-- Вставка начальных записей активности
INSERT INTO activity_messages (user_id, message, type)
SELECT id, 'Аккаунт успешно создан и активирован', 'success'
FROM users WHERE username IN ('RondetOdinn', 'Chadee');

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crypto_journal_updated_at BEFORE UPDATE ON crypto_journal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание представлений для удобства
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    COUNT(cj.id) as total_trades,
    COALESCE(SUM(cj.profit_loss), 0) as total_pnl,
    COALESCE(AVG(cj.profit_loss), 0) as avg_pnl,
    COUNT(CASE WHEN cj.profit_loss > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN cj.profit_loss < 0 THEN 1 END) as losing_trades
FROM users u
LEFT JOIN crypto_journal cj ON u.id = cj.user_id
GROUP BY u.id, u.username, u.full_name;

-- Создание представления для баланса пользователей
CREATE VIEW user_balances AS
SELECT 
    u.id,
    u.username,
    COALESCE(SUM(CASE WHEN be.type IN ('deposit', 'trade_profit', 'income') THEN be.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN be.type IN ('withdrawal', 'trade_loss', 'expense') THEN be.amount ELSE 0 END), 0) as current_balance
FROM users u
LEFT JOIN balance_entries be ON u.id = be.user_id
GROUP BY u.id, u.username;

COMMIT;
