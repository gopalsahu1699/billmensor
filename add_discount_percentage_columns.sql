-- Run this in Supabase SQL Editor to add discount percentage columns

-- Add to invoice_items table
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'amount' CHECK (discount_type IN ('amount', 'percent')),
  ADD COLUMN IF NOT EXISTS discount_rate numeric DEFAULT 0;

-- Add to invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS general_discount_type text DEFAULT 'amount' CHECK (general_discount_type IN ('amount', 'percent'));

-- Add to quotations table
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS general_discount_type text DEFAULT 'amount' CHECK (general_discount_type IN ('amount', 'percent'));

-- Also add discount_type and discount_rate to quotation_items if it exists
-- (quotations use the same invoice_items table, so the above ALTER covers it)

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'invoice_items'
  AND column_name IN ('discount_type', 'discount_rate')
ORDER BY column_name;
