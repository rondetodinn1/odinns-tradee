-- Drop existing table if it exists
DROP TABLE IF EXISTS notifications;

-- Create notifications table with correct column names
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sender TEXT,
  action_url TEXT,
  priority TEXT DEFAULT 'normal',
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX notifications_priority_idx ON notifications(priority);
CREATE INDEX notifications_expires_at_idx ON notifications(expires_at);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their notifications
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy to allow users to insert their own notifications
CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy to allow users to update only their notifications
CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy to allow users to delete only their notifications
CREATE POLICY notifications_delete_policy ON notifications
  FOR DELETE USING (auth.uid()::text = user_id);
