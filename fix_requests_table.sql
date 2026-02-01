-- ============================================
-- FIX REQUESTS TABLE RLS POLICIES
-- ============================================
-- The issue: RLS policies are trying to access auth.users table
-- which causes "permission denied for table users" error
-- Solution: Use profiles table instead

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON requests;

-- Users can view requests where they are the client OR volunteer
CREATE POLICY "Users can view own requests"
    ON requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = volunteer_id
    );

-- Users can create requests (they set their own client_id)
CREATE POLICY "Users can insert own requests"
    ON requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = client_id);

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
    ON requests FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = volunteer_id
    );

-- Admins can view all requests (using profiles table)
CREATE POLICY "Admins can view all requests"
    ON requests FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'COORDINATOR')
        )
    );

-- Admins can manage all requests (using profiles table)
CREATE POLICY "Admins can manage all requests"
    ON requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'COORDINATOR')
        )
    );
