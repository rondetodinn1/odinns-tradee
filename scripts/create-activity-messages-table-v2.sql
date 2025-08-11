-- Create activity_messages table for the activity feed
CREATE TABLE IF NOT EXISTS activity_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('trade_added', 'trade_deleted', 'trade_edited', 'status_changed', 'user_message')),
    message TEXT NOT NULL,
    details TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_messages_created_at ON activity_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_messages_user_id ON activity_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_messages_type ON activity_messages(type);

-- Add RLS (Row Level Security) if needed
ALTER TABLE activity_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read all messages
CREATE POLICY "Allow read access to all activity messages" ON activity_messages
    FOR SELECT USING (true);

-- Create policy to allow users to insert their own messages
CREATE POLICY "Allow users to insert their own messages" ON activity_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
