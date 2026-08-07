import { createServerClient } from '@supabase/ssr';

/**
 * Creates a Supabase server client with the SERVICE ROLE key.
 * This bypasses RLS and should ONLY be used in admin API routes
 * that are protected by isAdminRequest().
 */
export function createAdminSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin routes are disabled.');
    }

    return createServerClient(url, serviceKey, {
        cookies: {
            getAll() { return []; },
            setAll() { /* no-op */ },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
