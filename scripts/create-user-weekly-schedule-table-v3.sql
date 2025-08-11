-- Drop existing table if it exists
DROP TABLE IF EXISTS user_weekly_schedule CASCADE;

-- Create user weekly schedule table with proper structure
CREATE TABLE user_weekly_schedule (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '18:00:00',
    is_trading_day BOOLEAN NOT NULL DEFAULT true,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day_of_week)
);

-- Create index for faster queries
CREATE INDEX idx_user_weekly_schedule_user_id ON user_weekly_schedule(user_id);
CREATE INDEX idx_user_weekly_schedule_day ON user_weekly_schedule(day_of_week);

-- Enable RLS
ALTER TABLE user_weekly_schedule ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own weekly schedule" ON user_weekly_schedule
    FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "Users can insert their own weekly schedule" ON user_weekly_schedule
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "Users can update their own weekly schedule" ON user_weekly_schedule
    FOR UPDATE USING (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "Users can delete their own weekly schedule" ON user_weekly_schedule
    FOR DELETE USING (user_id = (SELECT id FROM users WHERE username = current_user));

-- Insert default schedule for all existing users
INSERT INTO user_weekly_schedule (user_id, day_of_week, start_time, end_time, is_trading_day, notes)
SELECT 
    u.id,
    generate_series(0, 6) as day_of_week,
    CASE 
        WHEN generate_series(0, 6) IN (0, 6) THEN '10:00:00'::TIME -- Weekend
        ELSE '09:00:00'::TIME -- Weekdays
    END as start_time,
    CASE 
        WHEN generate_series(0, 6) IN (0, 6) THEN '16:00:00'::TIME -- Weekend
        ELSE '18:00:00'::TIME -- Weekdays
    END as end_time,
    CASE 
        WHEN generate_series(0, 6) IN (0, 6) THEN false -- Weekend
        ELSE true -- Weekdays
    END as is_trading_day,
    CASE 
        WHEN generate_series(0, 6) = 0 THEN 'Воскресенье - выходной'
        WHEN generate_series(0, 6) = 1 THEN 'Понедельник - начало недели'
        WHEN generate_series(0, 6) = 2 THEN 'Вторник - активная торговля'
        WHEN generate_series(0, 6) = 3 THEN 'Среда - середина недели'
        WHEN generate_series(0, 6) = 4 THEN 'Четверг - подготовка к концу недели'
        WHEN generate_series(0, 6) = 5 THEN 'Пятница - завершение недели'
        WHEN generate_series(0, 6) = 6 THEN 'Суббота - выходной'
    END as notes
FROM users u
ON CONFLICT (user_id, day_of_week) DO NOTHING;
