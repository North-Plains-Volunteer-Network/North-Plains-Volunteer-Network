-- Add missing columns to requests table for admin review functionality
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS admin_review_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_review_reason TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN requests.admin_review_required IS 'Flags requests that need admin review (e.g., "Other" category selections)';
COMMENT ON COLUMN requests.admin_review_reason IS 'Reason why admin review is required';
