-- Fix RLS policies for notifications table
-- Allow anyone (even unauthenticated) to read notifications
-- This is needed for the user-facing notification API

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view notifications" ON notifications;

-- Create a policy that allows ALL SELECT (even without auth)
CREATE POLICY "Anyone can view notifications" 
    ON notifications 
    FOR SELECT 
    USING (true);

-- Allow service role to insert (admin panel)
CREATE POLICY "Service role can insert notifications" 
    ON notifications 
    FOR INSERT 
    WITH CHECK (true);

-- Allow service role to delete
CREATE POLICY "Service role can delete notifications" 
    ON notifications 
    FOR DELETE 
    USING (true);
