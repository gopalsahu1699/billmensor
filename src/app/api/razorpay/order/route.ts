import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PLAN_PRICES: Record<string, number> = {
    monthly: 199,
    yearly: 1999,
};

export async function POST(req: Request) {
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

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
        }

        const { planType } = await req.json();
        const price = PLAN_PRICES[planType as string];
        if (!price) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const options = {
            amount: price * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                planType,
                userId: user.id,
            },
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json(order);
    } catch (error: unknown) {
        console.error('Razorpay Order Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
