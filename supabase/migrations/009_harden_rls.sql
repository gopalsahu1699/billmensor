-- ============================================================
-- BillMensor 009: Harden RLS
--  - Remove coupon creation for arbitrary authenticated users (C3)
--  - Remove anonymous read access to all products (data leak)
--  - Make coupon max_uses check atomic
-- ============================================================

-- C3: Admin coupon creation uses the service role (bypasses RLS).
--     No RLS policy is needed for INSERT, so drop the permissive one.
DROP POLICY IF EXISTS "Authenticated users can create coupons" ON coupons;

-- Data leak: the previous policy allowed the anonymous role to SELECT
-- every product row that had a user_id set. Restrict to the owner only.
DROP POLICY IF EXISTS products_access ON products;
CREATE POLICY products_access ON products
    FOR SELECT
    USING (auth.uid() = user_id);

-- Atomic coupon usage claim: prevents two concurrent redemptions from
-- both passing the used_count < max_uses check. Replaces the old AFTER
-- INSERT trigger with a BEFORE INSERT claim that raises if the limit
-- is already reached.
DROP TRIGGER IF EXISTS trg_increment_coupon_usage ON coupon_redemptions;
DROP FUNCTION IF EXISTS increment_coupon_usage();

CREATE OR REPLACE FUNCTION claim_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    claimed BOOLEAN;
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = NEW.coupon_id
      AND used_count < max_uses
    RETURNING true INTO claimed;

    IF claimed IS NOT TRUE THEN
        RAISE EXCEPTION 'Coupon limit reached';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_claim_coupon_usage
    BEFORE INSERT ON coupon_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION claim_coupon_usage();
