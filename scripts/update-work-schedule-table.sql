-- Add columns for "not trading today" functionality
ALTER TABLE work_schedule 
ADD COLUMN IF NOT EXISTS not_trading_today BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS not_trading_date TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_work_schedule_not_trading_date ON work_schedule(not_trading_date);

-- Update existing records to have default values
UPDATE work_schedule 
SET not_trading_today = FALSE, not_trading_date = NULL 
WHERE not_trading_today IS NULL;
