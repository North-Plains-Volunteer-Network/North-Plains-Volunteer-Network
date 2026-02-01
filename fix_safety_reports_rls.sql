-- Drop the problematic policies that query auth.users
DROP POLICY IF EXISTS "Admins can manage safety reports" ON safety_reports;
DROP POLICY IF EXISTS "Admins can view all safety reports" ON safety_reports;

-- The existing insert and select policies should work fine:
-- "Users can create safety reports" - allows insert where reporter_id = auth.uid()
-- "Users can view own safety reports" - allows select where reporter_id = auth.uid()

-- If you need admins to view all reports, you'll need to use a different approach
-- that doesn't query auth.users. For now, let's just allow the basic functionality.
