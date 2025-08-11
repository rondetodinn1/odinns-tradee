-- Drop existing policies for users table
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY users_select_policy ON users 
  FOR SELECT USING (true);

CREATE POLICY users_insert_policy ON users 
  FOR INSERT WITH CHECK (true);

CREATE POLICY users_update_policy ON users 
  FOR UPDATE USING (true);

CREATE POLICY users_delete_policy ON users 
  FOR DELETE USING (true);

-- Drop existing policies for user_status table
DROP POLICY IF EXISTS user_status_select_policy ON user_status;
DROP POLICY IF EXISTS user_status_insert_policy ON user_status;
DROP POLICY IF EXISTS user_status_update_policy ON user_status;
DROP POLICY IF EXISTS user_status_delete_policy ON user_status;

-- Enable RLS for user_status
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Create policies for user_status table
CREATE POLICY user_status_select_policy ON user_status
  FOR SELECT USING (true);

CREATE POLICY user_status_insert_policy ON user_status
  FOR INSERT WITH CHECK (true);

CREATE POLICY user_status_update_policy ON user_status
  FOR UPDATE USING (true);

CREATE POLICY user_status_delete_policy ON user_status
  FOR DELETE USING (true);
