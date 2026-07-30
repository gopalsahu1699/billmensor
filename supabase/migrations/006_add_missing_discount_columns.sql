-- Migration: Add missing discount columns to invoice_items and quotation_items
-- Run this in Supabase SQL Editor

-- Add per_unit_discount to invoice_items (used for per-unit discount tracking)
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS per_unit_discount numeric DEFAULT 0;

-- Add missing columns to quotation_items
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'amount';
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_rate numeric DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS per_unit_discount numeric DEFAULT 0;
