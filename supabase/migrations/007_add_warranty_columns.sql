-- Migration: Add warranty columns to products, invoice_items and quotation_items
-- Run this in Supabase SQL Editor

-- Add warranty to products (used to store per-product warranty details)
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty TEXT;

-- Add warranty to invoice_items (snapshot of product warranty at invoice time)
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS warranty TEXT;

-- Add warranty to quotation_items (snapshot of product warranty at quotation time)
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS warranty TEXT;
