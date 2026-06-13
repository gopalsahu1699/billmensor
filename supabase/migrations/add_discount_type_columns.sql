-- Migration: Add discount_type columns for proper discount display
-- Run this in Supabase SQL Editor

-- Per-item discount type
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'amount';
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'amount';

-- Invoice-level discount type
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS general_discount_type VARCHAR(20) DEFAULT 'amount';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS general_discount_type VARCHAR(20) DEFAULT 'amount';
