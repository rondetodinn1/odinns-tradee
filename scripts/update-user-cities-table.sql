-- Drop existing table if it exists
DROP TABLE IF EXISTS user_cities CASCADE;

-- Create user cities table with proper structure
CREATE TABLE user_cities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL DEFAULT 'UA',
    country_name VARCHAR(100) DEFAULT '',
    timezone VARCHAR(50) DEFAULT 'Europe/Kiev',
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_user_cities_user_id ON user_cities(user_id);
CREATE INDEX idx_user_cities_city ON user_cities(city_name);

-- Enable RLS
ALTER TABLE user_cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own city" ON user_cities
    FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "Users can insert their own city" ON user_cities
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "Users can update their own city" ON user_cities
    FOR UPDATE USING (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "Users can delete their own city" ON user_cities
    FOR DELETE USING (user_id = (SELECT id FROM users WHERE username = current_user));

-- Insert default cities for existing users
INSERT INTO user_cities (user_id, city_name, country_code, country_name, timezone)
SELECT 
    id,
    'Kiev' as city_name,
    'UA' as country_code,
    'Ukraine' as country_name,
    'Europe/Kiev' as timezone
FROM users
ON CONFLICT (user_id) DO NOTHING;
