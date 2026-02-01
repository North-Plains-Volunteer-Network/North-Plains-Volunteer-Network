-- Check profiles schema and RLS
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

SELECT * FROM pg_policies WHERE tablename = 'profiles';
