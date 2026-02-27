import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    try {
        const { planType, amount } = await req.json();

        if (!planType || !amount) {
            return NextResponse.json({ error: 'Plan type and amount are required' }, { status: 400 });
        }

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                planType: planType,
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
