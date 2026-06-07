import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';

export async function GET(req: NextRequest) {
    try {
        if (!isAdminRequest(req)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const supabase = createAdminSupabaseClient();

        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!isAdminRequest(req)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const supabase = createAdminSupabaseClient();
        const body = await req.json();
        const {
            code,
            description,
            plan_type = 'yearly',
            discount_percent = 100,
            max_uses = 1,
            per_user_limit = 1,
            valid_until = null,
        } = body;

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('coupons')
            .insert({
                code: (code as string).toUpperCase(),
                description: description || null,
                plan_type,
                discount_percent,
                max_uses,
                per_user_limit,
                valid_until,
                is_active: true,
            })
            .select()
            .limit(1);

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data?.[0], { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
