-- Add missing group event columns to requests table
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS is_group_event BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_volunteers INTEGER DEFAULT 1;

-- Add comments
COMMENT ON COLUMN requests.is_group_event IS 'Whether this request is for a group event requiring multiple volunteers';
COMMENT ON COLUMN requests.max_volunteers IS 'Maximum number of volunteers needed for this request';
