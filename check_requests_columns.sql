-- Check what columns exist in the requests table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'requests'
ORDER BY ordinal_position;
