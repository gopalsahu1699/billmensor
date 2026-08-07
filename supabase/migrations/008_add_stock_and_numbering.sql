-- ============================================================
-- BillMensor 008: Atomic stock RPCs + unique invoice/purchase numbering
-- ============================================================

-- Atomic stock increment (SECURITY INVOKER so RLS scoping to own products applies)
CREATE OR REPLACE FUNCTION increment_stock(pid UUID, qty NUMERIC)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products
    SET stock_quantity = COALESCE(stock_quantity, 0) + qty
    WHERE id = pid;
END;
$$;

-- Atomic stock decrement (never goes below zero)
CREATE OR REPLACE FUNCTION decrement_stock(pid UUID, qty NUMERIC)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty)
    WHERE id = pid;
END;
$$;

-- Unique invoice/purchase numbers per user (prevents duplicate-numbering race)
CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_user_unique ON invoices (user_id, invoice_number);
CREATE UNIQUE INDEX IF NOT EXISTS purchases_number_user_unique ON purchases (user_id, purchase_number);
