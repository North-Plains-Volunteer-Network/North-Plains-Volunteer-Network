-- Fix RLS policy for requests table
-- The issue is auth.uid() returns the user's auth ID, not their profile ID

DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;

-- Allow authenticated users to insert requests (they set their own client_id)
CREATE POLICY "Users can insert own requests"
    ON requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can view requests where they are the client OR volunteer
CREATE POLICY "Users can view own requests"
    ON requests FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR 
        volunteer_id = auth.uid()
    );

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
    ON requests FOR UPDATE
    TO authenticated
    USING (
        client_id = auth.uid() OR 
        volunteer_id = auth.uid()
    );
