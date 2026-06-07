import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch { /* Ignore */ }
                    },
                },
            }
        );

        // Try to get the current user (may not be logged in via API)
        const { data: { user } } = await supabase.auth.getUser();

        // Get user's plan_type from profiles table
        let planType = 'free';
        if (user?.id) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('plan_type')
                .limit(1);
            if (profileData && profileData.length > 0) {
                planType = profileData[0].plan_type || 'free';
            }
        }

        // Build query with correct target_audience filtering
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (user?.id) {
            // Show notifications based on target_audience and user's plan type
            if (planType === 'free') {
                // Free users see: all + free-targeted notifications
                query = query.or('target_audience.eq.all,target_audience.eq.free');
            } else {
                // Premium users see: all + premium-targeted + free-targeted notifications
                query = query.or('target_audience.eq.all,target_audience.eq.premium,target_audience.eq.free');
            }
        } else {
            // Not logged in: show only broadcast notifications
            query = query.eq('target_audience', 'all');
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notifications: data || [] });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
