import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminSupabaseClient();

        if (!isAdminRequest(req)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Total users
        const { count: totalUsers, error: totalError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (totalError) {
            return NextResponse.json({ error: totalError.message }, { status: 500 });
        }

        // Premium users (plan_type != 'free')
        const { count: premiumUsers, error: premiumError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .neq('plan_type', 'free');

        if (premiumError) {
            return NextResponse.json({ error: premiumError.message }, { status: 500 });
        }

        // Active premium (plan_status = 'active' and plan_type != 'free')
        const { count: activePremium, error: activeError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('plan_status', 'active')
            .neq('plan_type', 'free');

        if (activeError) {
            return NextResponse.json({ error: activeError.message }, { status: 500 });
        }

        // Expiring soon (plan_expiry within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiryThreshold = thirtyDaysFromNow.toISOString();

        const { count: expiringSoon, error: expiringError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .lt('plan_expiry', expiryThreshold)
            .gt('plan_expiry', new Date().toISOString())
            .neq('plan_type', 'free');

        if (expiringError) {
            return NextResponse.json({ error: expiringError.message }, { status: 500 });
        }

        // Total coupons
        const { count: totalCoupons, error: couponsError } = await supabase
            .from('coupons')
            .select('*', { count: 'exact', head: true });

        if (couponsError) {
            return NextResponse.json({ error: couponsError.message }, { status: 500 });
        }

        // Total redemptions (sum of used_count from coupons)
        const { data: couponsData, error: redemptionsError } = await supabase
            .from('coupons')
            .select('used_count');

        if (redemptionsError) {
            return NextResponse.json({ error: redemptionsError.message }, { status: 500 });
        }

        const totalRedemptions = couponsData?.reduce((sum, c) => sum + (c.used_count || 0), 0) || 0;

        const stats = {
            totalUsers: totalUsers || 0,
            premiumUsers: premiumUsers || 0,
            activePremium: activePremium || 0,
            expiringSoon: expiringSoon || 0,
            totalCoupons: totalCoupons || 0,
            totalRedemptions,
        };

        return NextResponse.json(stats);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
