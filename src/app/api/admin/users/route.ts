import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminSupabaseClient();

        if (!isAdminRequest(req)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const search = searchParams.get('search') || '';
        const plan_type = searchParams.get('plan_type') || '';
        const plan_status = searchParams.get('plan_status') || '';

        // Build query with filters
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' });

        // Apply search filter (full_name, email, or company_name)
        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
            );
        }

        // Apply plan_type filter
        if (plan_type) {
            query = query.eq('plan_type', plan_type);
        }

        // Apply plan_status filter
        if (plan_status) {
            query = query.eq('plan_status', plan_status);
        }

        // Calculate range for pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const totalPages = Math.ceil((count || 0) / limit);

        return NextResponse.json({
            users: data || [],
            total: count || 0,
            page,
            totalPages,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
