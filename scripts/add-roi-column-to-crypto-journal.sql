-- Add ROI percentage column to crypto_journal table
ALTER TABLE crypto_journal 
ADD COLUMN IF NOT EXISTS roi_percentage DECIMAL DEFAULT 0;

-- Update existing records to have 0 ROI if null
UPDATE crypto_journal 
SET roi_percentage = 0 
WHERE roi_percentage IS NULL;

-- Add comment to the column
COMMENT ON COLUMN crypto_journal.roi_percentage IS 'Return on Investment percentage for the trade';
