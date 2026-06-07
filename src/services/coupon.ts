import { supabase } from '@/lib/supabase'
import { Coupon, CouponRedemption, CouponValidationResult } from '@/types'

/**
 * Validate a coupon code for the current user.
 * Checks: exists, active, valid_from, valid_until, max_uses, per_user_limit
 */
export async function validateCoupon(code: string): Promise<CouponValidationResult> {
    const upperCode = code.trim().toUpperCase()

    // 1. Fetch coupon
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', upperCode)
        .eq('is_active', true)
        .limit(1)

    if (error || !data || data.length === 0) {
        return { valid: false, error: 'Invalid coupon code' }
    }

    const coupon: Coupon = data[0]

    // 2. Check valid_from
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
        return { valid: false, error: 'Coupon not yet active' }
    }

    // 3. Check valid_until
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return { valid: false, error: 'Coupon has expired' }
    }

    // 4. Check max_uses
    if (coupon.used_count >= coupon.max_uses) {
        return { valid: false, error: 'Coupon limit reached' }
    }

    // 5. Check per_user_limit
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { count, error: countError } = await supabase
            .from('coupon_redemptions')
            .select('id', { count: 'exact', head: true })
            .eq('coupon_id', coupon.id)
            .eq('user_id', user.id)

        if (!countError && count !== null && count >= coupon.per_user_limit) {
            return { valid: false, error: 'You have already used this coupon' }
        }
    }

    return {
        valid: true,
        coupon,
        plan_type: coupon.plan_type,
        discount_percent: coupon.discount_percent,
    }
}

/**
 * Redeem a coupon — applies plan to user profile, records redemption.
 * Returns { success, error?, plan_type? }
 */
export async function redeemCoupon(code: string): Promise<{ success: boolean; error?: string; plan_type?: string }> {
    // 1. Validate first
    const validation = await validateCoupon(code)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }

    const coupon = validation.coupon!

    // 2. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
    }

    // 3. Calculate plan_expiry based on plan_type
    let planExpiry: string | null = null
    const now = new Date()

    if (coupon.plan_type === 'lifetime') {
        const farFuture = new Date('2099-12-31T23:59:59Z')
        planExpiry = farFuture.toISOString()
    } else if (coupon.plan_type === 'yearly') {
        const expiry = new Date(now)
        expiry.setFullYear(expiry.getFullYear() + 1)
        planExpiry = expiry.toISOString()
    } else if (coupon.plan_type === 'monthly') {
        const expiry = new Date(now)
        expiry.setMonth(expiry.getMonth() + 1)
        planExpiry = expiry.toISOString()
    }

    // 4. Insert into coupon_redemptions
    const { error: redemptionError } = await supabase
        .from('coupon_redemptions')
        .insert({
            coupon_id: coupon.id,
            user_id: user.id,
            plan_granted: coupon.plan_type,
            payment_amount: 0,
        })

    if (redemptionError) {
        return { success: false, error: redemptionError.message }
    }

    // 5. Update profiles table
    const updateData: Record<string, unknown> = {
        plan_type: coupon.plan_type,
        plan_status: 'active',
    }
    if (planExpiry) {
        updateData.plan_expiry = planExpiry
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (profileError) {
        return { success: false, error: profileError.message }
    }

    return { success: true, plan_type: coupon.plan_type }
}

/**
 * Get all coupons (admin), ordered by created_at desc.
 */
export async function getAllCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching coupons:', error)
        return []
    }

    return data as Coupon[]
}

/**
 * Create a new coupon (admin).
 */
export async function createCoupon(data: Partial<Coupon>, adminAuthHeader?: string): Promise<{ success: boolean; error?: string; coupon?: Coupon }> {
    const code = (data.code || '').toUpperCase()

    const insertData: Record<string, unknown> = {
        code,
        description: data.description || null,
        plan_type: data.plan_type || 'yearly',
        discount_percent: data.discount_percent ?? 100,
        max_uses: data.max_uses ?? 1,
        per_user_limit: data.per_user_limit ?? 1,
        valid_from: data.valid_from || new Date().toISOString(),
        valid_until: data.valid_until || null,
        is_active: true,
    }

    const fetchOptions: RequestInit = {}
    if (adminAuthHeader) {
        fetchOptions.headers = { 'Authorization': adminAuthHeader }
    }

    const { data: created, error } = await supabase
        .from('coupons')
        .insert(insertData)
        .select()
        .limit(1)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, coupon: created?.[0] as Coupon }
}

/**
 * Deactivate a coupon (admin).
 */
export async function deactivateCoupon(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Get redemption records for a coupon (stats).
 */
export async function getCouponStats(couponId: string): Promise<CouponRedemption[]> {
    const { data, error } = await supabase
        .from('coupon_redemptions')
        .select('*')
        .eq('coupon_id', couponId)
        .order('redeemed_at', { ascending: false })

    if (error) {
        console.error('Error fetching coupon stats:', error)
        return []
    }

    return data as CouponRedemption[]
}
