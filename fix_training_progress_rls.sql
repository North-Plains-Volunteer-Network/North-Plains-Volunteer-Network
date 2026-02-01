-- Fix training_progress table issues

-- 1. Remove completed_at column reference from service (or add it to table)
-- Since the table schema you showed earlier doesn't have completed_at, let's check what columns exist
-- Run this first to see current schema:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'training_progress';

-- 2. Fix RLS policies - remove policies that query auth.users table
DROP POLICY IF EXISTS "Admins can view all training progress" ON training_progress;

-- The basic policies should work:
-- "Users can view own training progress" - allows select where user_id = auth.uid()
-- "Users can update own training progress" - allows update where user_id = auth.uid()

-- If those don't exist, create them. PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY in all versions, so we drop first.
DROP POLICY IF EXISTS "Users can manage own training progress" ON training_progress;

CREATE POLICY "Users can manage own training progress"
ON training_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
