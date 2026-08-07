import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PLAN_PRICES: Record<string, number> = {
    monthly: 199,
    yearly: 1999,
};

export async function POST(req: Request) {
    console.log('--- API Verification Request Started ---');
    try {
        const cookieStore = await cookies();

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = await req.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('Signature mismatch');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        let order;
        try {
            order = await razorpay.orders.fetch(razorpay_order_id);
        } catch (error: unknown) {
            console.error('Razorpay Order Fetch Error:', error);
            return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
        }

        const orderPlan = (order.notes as { planType?: string } | null | undefined)?.planType;
        const expectedPrice = PLAN_PRICES[orderPlan ?? ''] ?? 0;

        if (orderPlan !== planType || (order.amount ?? 0) !== expectedPrice * 100) {
            console.error('Plan/amount mismatch', { orderPlan, planType, orderAmount: order.amount });
            return NextResponse.json({ error: 'Payment does not match the requested plan' }, { status: 400 });
        }

        if (order.status !== 'paid') {
            console.error('Order not paid', { status: order.status });
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

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

        console.log('Attempting auth.getUser()...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Razorpay Auth Error (Detailed):', authError);
            return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
        }

        console.log('Auth successful for user:', user.id);

        const expiryDate = new Date();
        if (orderPlan === 'monthly') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (orderPlan === 'yearly') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                plan_type: orderPlan,
                plan_status: 'active',
                plan_expiry: expiryDate.toISOString(),
                last_payment_id: razorpay_payment_id
            })
            .eq('id', user.id);

        if (error) {
            console.error('Database Update Error:', error);
            throw error;
        }

        console.log('Profile updated successfully');
        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Razorpay Verification Global Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
