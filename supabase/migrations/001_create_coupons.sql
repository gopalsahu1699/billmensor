-- ============================================================
-- BillMensor Coupon System Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Coupons table: stores all coupon/promo codes
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- What the coupon grants
    plan_type TEXT NOT NULL DEFAULT 'yearly' 
        CHECK (plan_type IN ('free', 'monthly', 'yearly', 'lifetime')),
    
    -- Discount: 0-100 (percentage off). 100 = fully free
    discount_percent INTEGER NOT NULL DEFAULT 100 
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
    
    -- Usage limits
    max_uses INTEGER NOT NULL DEFAULT 1,          -- total times this coupon can be redeemed
    used_count INTEGER NOT NULL DEFAULT 0,         -- how many times it has been used
    per_user_limit INTEGER NOT NULL DEFAULT 1,     -- max times a single user can use it
    
    -- Validity period
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,                       -- NULL = never expires
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupon redemptions: tracks who used which coupon
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plan_granted TEXT NOT NULL,
    payment_amount INTEGER NOT NULL DEFAULT 0,     -- 0 for free coupons
    
    -- Prevent duplicate redemptions
    UNIQUE(coupon_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
-- Anyone can read active coupons (for validation)
CREATE POLICY "Anyone can view active coupons" 
    ON coupons FOR SELECT 
    USING (is_active = true);

-- Only authenticated users can insert (admin creation via API with service role)
CREATE POLICY "Authenticated users can create coupons" 
    ON coupons FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for coupon_redemptions
-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions" 
    ON coupon_redemptions FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own redemptions
CREATE POLICY "Users can create own redemptions" 
    ON coupon_redemptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Function to auto-increment used_count on coupon
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment used_count
DROP TRIGGER IF EXISTS trg_increment_coupon_usage ON coupon_redemptions;
CREATE TRIGGER trg_increment_coupon_usage
    AFTER INSERT ON coupon_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_usage();

-- ============================================================
-- SEED DATA: Example coupons (uncomment to use)
-- ============================================================

-- Lifetime free for first 10 users
-- INSERT INTO coupons (code, description, plan_type, discount_percent, max_uses, per_user_limit, valid_until)
-- VALUES ('LIFETIME10', 'Lifetime free for first 10 users', 'lifetime', 100, 10, 1, NOW() + INTERVAL '30 days');

-- 1 year free for first 50 users
-- INSERT INTO coupons (code, description, plan_type, discount_percent, max_uses, per_user_limit, valid_until)
-- VALUES ('YEARFREE50', '1 Year free for first 50 users', 'yearly', 100, 50, 1, NOW() + INTERVAL '60 days');

-- Single-use influencer coupon
-- INSERT INTO coupons (code, description, plan_type, discount_percent, max_uses, per_user_limit, valid_until)
-- VALUES ('INFLUENCER2024', 'Influencer special - lifetime free', 'lifetime', 100, 1, 1, NULL);

-- 50% off yearly plan (unlimited uses, 30 days)
-- INSERT INTO coupons (code, description, plan_type, discount_percent, max_uses, per_user_limit, valid_until)
-- VALUES ('HALFOFF', '50% off yearly backup plan', 'yearly', 50, 999999, 1, NOW() + INTERVAL '30 days');
