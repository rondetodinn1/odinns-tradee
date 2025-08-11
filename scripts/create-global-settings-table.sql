-- Создаем таблицу для глобальных настроек
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем глобальный пароль
INSERT INTO global_settings (setting_key, setting_value, description) 
VALUES ('global_password', 'odinns3048', 'Глобальный пароль для доступа к приложению')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Включаем RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Политика: только чтение для всех
CREATE POLICY "Allow read access to global_settings" ON global_settings
  FOR SELECT USING (true);

-- Политика: запрет на изменение через обычные запросы
CREATE POLICY "Deny all modifications to global_settings" ON global_settings
  FOR ALL USING (false);

COMMIT;
