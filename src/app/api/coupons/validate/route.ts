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
            return NextResponse.json({ valid: false, error: 'Coupon code is required' }, { status: 400 });
        }

        const upperCode = code.toUpperCase();

        // 1. Fetch coupon
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', upperCode)
            .eq('is_active', true)
            .limit(1);

        if (error || !data || data.length === 0) {
            return NextResponse.json({ valid: false, error: 'Invalid coupon code' });
        }

        const coupon = data[0];

        // 2. Check valid_from
        if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
            return NextResponse.json({ valid: false, error: 'Coupon not yet active' });
        }

        // 3. Check valid_until
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return NextResponse.json({ valid: false, error: 'Coupon has expired' });
        }

        // 4. Check max_uses
        if (coupon.used_count >= coupon.max_uses) {
            return NextResponse.json({ valid: false, error: 'Coupon limit reached' });
        }

        // 5. Check per_user_limit
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { count, error: countError } = await supabase
                .from('coupon_redemptions')
                .select('id', { count: 'exact', head: true })
                .eq('coupon_id', coupon.id)
                .eq('user_id', user.id);

            if (!countError && count !== null && count >= coupon.per_user_limit) {
                return NextResponse.json({ valid: false, error: 'You have already used this coupon' });
            }
        }

        return NextResponse.json({
            valid: true,
            plan_type: coupon.plan_type,
            discount_percent: coupon.discount_percent,
            description: coupon.description,
            max_uses: coupon.max_uses,
            used_count: coupon.used_count,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ valid: false, error: message }, { status: 500 });
    }
}
