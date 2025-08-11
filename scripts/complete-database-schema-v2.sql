-- Полная схема базы данных для ODINNS Platform (обновленная версия)
-- Удаляем существующие таблицы если они есть (осторожно!)
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS work_schedule CASCADE;
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
  balance DECIMAL(20,2) DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы статусов пользователей
CREATE TABLE user_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Создание таблицы рабочих расписаний
CREATE TABLE work_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Europe/Kiev',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Создание таблицы финансовых целей
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_username VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(20,2) NOT NULL,
  current_amount DECIMAL(20,2) DEFAULT 0,
  target_date DATE NOT NULL,
  participants UUID[] DEFAULT ARRAY[]::UUID[],
  status VARCHAR(20) DEFAULT 'active', -- active, completed, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX idx_work_schedule_user_id ON work_schedule(user_id);
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_created_by ON financial_goals(created_by);
CREATE INDEX idx_crypto_journal_user_id ON crypto_journal(user_id);
CREATE INDEX idx_crypto_journal_cryptocurrency ON crypto_journal(cryptocurrency);
CREATE INDEX idx_crypto_journal_created_at ON crypto_journal(created_at);
CREATE INDEX idx_balance_entries_user_id ON balance_entries(user_id);
CREATE INDEX idx_balance_entries_type ON balance_entries(type);
CREATE INDEX idx_balance_entries_created_at ON balance_entries(created_at);
CREATE INDEX idx_activity_messages_user_id ON activity_messages(user_id);
CREATE INDEX idx_activity_messages_is_read ON activity_messages(is_read);
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);

-- Вставка пользователей
INSERT INTO users (username, password_hash, email, full_name, balance, role) VALUES 
('RondetOdinn', 'Rop123456789mopik!', 'rondet@odinns.com', 'Rondet Odinn', 5000.00, 'admin'),
('Chadee', '1234', 'chadee@odinns.com', 'Chadee', 3500.00, 'user');

-- Вставка начальных статусов
INSERT INTO user_status (user_id, status) 
SELECT id, 'online' FROM users WHERE username IN ('RondetOdinn', 'Chadee');

-- Вставка начальных рабочих расписаний
INSERT INTO work_schedule (user_id, start_time, end_time, timezone)
SELECT id, '09:00:00', '18:00:00', 'Europe/Kiev' FROM users WHERE username = 'RondetOdinn';

INSERT INTO work_schedule (user_id, start_time, end_time, timezone)
SELECT id, '10:00:00', '19:00:00', 'Europe/Kiev' FROM users WHERE username = 'Chadee';

-- Вставка примеров финансовых целей
INSERT INTO financial_goals (user_id, created_by, created_by_username, title, description, target_amount, current_amount, target_date, participants, status)
SELECT 
  id, 
  id, 
  username, 
  'Достичь $10,000 прибыли', 
  'Цель заработать $10,000 от торговли криптовалютами в этом месяце', 
  10000.00, 
  2500.00, 
  CURRENT_DATE + INTERVAL '30 days',
  ARRAY[id],
  'active'
FROM users WHERE username = 'RondetOdinn';

INSERT INTO financial_goals (user_id, created_by, created_by_username, title, description, target_amount, current_amount, target_date, participants, status)
SELECT 
  id, 
  id, 
  username, 
  'Накопить $5,000', 
  'Накопить $5,000 для инвестиций в новые проекты', 
  5000.00, 
  1200.00, 
  CURRENT_DATE + INTERVAL '60 days',
  ARRAY[id],
  'active'
FROM users WHERE username = 'Chadee';

-- Вставка начальных записей активности
INSERT INTO activity_messages (user_id, message, type)
SELECT id, 'Аккаунт успешно создан и активирован', 'success'
FROM users WHERE username IN ('RondetOdinn', 'Chadee');

-- Вставка примеров торговых записей
INSERT INTO crypto_journal (user_id, cryptocurrency, entry_point, exit_point, quantity, details, profit_loss, trade_type, status)
SELECT 
  id, 
  'BTC', 
  45000.00, 
  47000.00, 
  0.1, 
  'Купил на падении, продал на росте', 
  200.00, 
  'buy', 
  'closed'
FROM users WHERE username = 'RondetOdinn';

INSERT INTO crypto_journal (user_id, cryptocurrency, entry_point, quantity, details, trade_type, status)
SELECT 
  id, 
  'ETH', 
  3200.00, 
  0.5, 
  'Долгосрочная позиция', 
  'buy', 
  'open'
FROM users WHERE username = 'Chadee';

-- Вставка записей баланса
INSERT INTO balance_entries (user_id, amount, type, category, description)
SELECT id, 5000.00, 'deposit', 'initial', 'Начальный депозит' FROM users WHERE username = 'RondetOdinn';

INSERT INTO balance_entries (user_id, amount, type, category, description)
SELECT id, 3500.00, 'deposit', 'initial', 'Начальный депозит' FROM users WHERE username = 'Chadee';

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
CREATE TRIGGER update_work_schedule_updated_at BEFORE UPDATE ON work_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crypto_journal_updated_at BEFORE UPDATE ON crypto_journal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание представлений для удобства
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.balance,
    COUNT(cj.id) as total_trades,
    COALESCE(SUM(cj.profit_loss), 0) as total_pnl,
    COALESCE(AVG(cj.profit_loss), 0) as avg_pnl,
    COUNT(CASE WHEN cj.profit_loss > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN cj.profit_loss < 0 THEN 1 END) as losing_trades
FROM users u
LEFT JOIN crypto_journal cj ON u.id = cj.user_id
GROUP BY u.id, u.username, u.full_name, u.balance;

-- Создание представления для баланса пользователей
CREATE VIEW user_balances AS
SELECT 
    u.id,
    u.username,
    u.balance as current_balance,
    COALESCE(SUM(CASE WHEN be.type IN ('deposit', 'trade_profit', 'income') THEN be.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN be.type IN ('withdrawal', 'trade_loss', 'expense') THEN be.amount ELSE 0 END), 0) as total_expenses
FROM users u
LEFT JOIN balance_entries be ON u.id = be.user_id
GROUP BY u.id, u.username, u.balance;

COMMIT;
