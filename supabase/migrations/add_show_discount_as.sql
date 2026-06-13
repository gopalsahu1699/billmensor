-- Migration: Add show_discount_as column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_discount_as VARCHAR(20) DEFAULT 'amount';

-- Add comment for documentation
COMMENT ON COLUMN profiles.show_discount_as IS 'How to display discounts in print templates: "amount" (rupee value) or "percentage" (percentage value)';
