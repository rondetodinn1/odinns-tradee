-- Create user weekly schedule table with proper structure
CREATE TABLE IF NOT EXISTS user_weekly_schedule (
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
CREATE INDEX IF NOT EXISTS idx_user_weekly_schedule_user_id ON user_weekly_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_schedule_day ON user_weekly_schedule(day_of_week);

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
