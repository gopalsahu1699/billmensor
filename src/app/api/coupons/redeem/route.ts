import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignore
                        }
                    },
                },
            }
        );

        const { code } = await req.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 });
        }

        const upperCode = code.toUpperCase();

        // 1. Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // 2. Fetch and validate coupon
        const { data: couponData, error: fetchError } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', upperCode)
            .eq('is_active', true)
            .limit(1);

        if (fetchError || !couponData || couponData.length === 0) {
            return NextResponse.json({ success: false, error: 'Invalid coupon code' });
        }

        const coupon = couponData[0];

        // 3. Check valid_from
        if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
            return NextResponse.json({ success: false, error: 'Coupon not yet active' });
        }

        // 4. Check valid_until
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return NextResponse.json({ success: false, error: 'Coupon has expired' });
        }

        // 5. Check max_uses
        if (coupon.used_count >= coupon.max_uses) {
            return NextResponse.json({ success: false, error: 'Coupon limit reached' });
        }

        // 6. Check per_user_limit
        const { count: userRedemptions, error: countError } = await supabase
            .from('coupon_redemptions')
            .select('id', { count: 'exact', head: true })
            .eq('coupon_id', coupon.id)
            .eq('user_id', user.id);

        if (!countError && userRedemptions !== null && userRedemptions >= coupon.per_user_limit) {
            return NextResponse.json({ success: false, error: 'You have already used this coupon' });
        }

        // 7. Calculate plan_expiry based on plan_type
        let planExpiry: string | null = null;
        const now = new Date();

        if (coupon.plan_type === 'lifetime') {
            const farFuture = new Date('2099-12-31T23:59:59Z');
            planExpiry = farFuture.toISOString();
        } else if (coupon.plan_type === 'yearly') {
            const expiry = new Date(now);
            expiry.setFullYear(expiry.getFullYear() + 1);
            planExpiry = expiry.toISOString();
        } else if (coupon.plan_type === 'monthly') {
            const expiry = new Date(now);
            expiry.setMonth(expiry.getMonth() + 1);
            planExpiry = expiry.toISOString();
        }

        // 8. Insert into coupon_redemptions
        const { error: redemptionError } = await supabase
            .from('coupon_redemptions')
            .insert({
                coupon_id: coupon.id,
                user_id: user.id,
                plan_granted: coupon.plan_type,
                payment_amount: 0,
            });

        if (redemptionError) {
            return NextResponse.json({ success: false, error: redemptionError.message }, { status: 500 });
        }

        // 9. Update profiles table
        const updateData: Record<string, unknown> = {
            plan_type: coupon.plan_type,
            plan_status: 'active',
        };
        if (planExpiry) {
            updateData.plan_expiry = planExpiry;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (profileError) {
            return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, plan_type: coupon.plan_type });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
