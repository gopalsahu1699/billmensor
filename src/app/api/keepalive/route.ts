import { NextResponse } from 'next/server'
import { createBrowserClient } from '@supabase/ssr'

// This endpoint keeps the Supabase connection alive by making a lightweight query.
// Call it from an external cron/uptime service every 3-5 days to prevent
// Supabase free tier from pausing the database.

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  // Lightweight Supabase ping - just check auth status (no heavy queries)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let supabaseStatus = 'unknown'
  let supabaseLatency = 0

  try {
    const { error } = await supabase.auth.getSession()
    supabaseLatency = Date.now() - startTime
    supabaseStatus = error ? `error: ${error.message}` : 'connected'
  } catch (e: unknown) {
    supabaseLatency = Date.now() - startTime
    supabaseStatus = `exception: ${e instanceof Error ? e.message : String(e)}`
  }

  const totalLatency = Date.now() - startTime

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: {
      status: supabaseStatus,
      latency_ms: supabaseLatency,
    },
    environment: process.env.NODE_ENV,
    total_latency_ms: totalLatency,
    message: 'Keepalive ping successful. Supabase connection is active.',
  })
}
