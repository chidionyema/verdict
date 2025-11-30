-- Add requested_tone column to verdict_requests table
-- Allows users to specify desired feedback tone: 'encouraging', 'honest', or 'brutally_honest'

ALTER TABLE verdict_requests
ADD COLUMN IF NOT EXISTS requested_tone TEXT 
  CHECK (requested_tone IN ('encouraging', 'honest', 'brutally_honest'))
  DEFAULT 'honest';

-- Add index for filtering requests by tone preference
CREATE INDEX IF NOT EXISTS idx_verdict_requests_requested_tone 
ON verdict_requests(requested_tone);

-- Update existing requests to have default 'honest' tone
UPDATE verdict_requests 
SET requested_tone = 'honest' 
WHERE requested_tone IS NULL;

