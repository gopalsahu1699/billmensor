-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'promotional', 'urgent')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'premium', 'free', 'selected')),
    target_user_ids UUID[] DEFAULT '{}',
    sent_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view notifications
CREATE POLICY "Authenticated users can view notifications"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Service role (admin) can insert notifications
CREATE POLICY "Service role can insert notifications"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
