import { NextResponse } from 'next/server'
// The client you can use to perform role-based redirects and token exchanges
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Also support implicit flow redirects which some providers natively fallback to
  const access_token = searchParams.get('access_token')

  // If a standard PKCE Auth code is provided (the default for Supabase)
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Exchange the code for a session token and store in cookies securely
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
    
    // Fallback error redirection
    console.error('Code exchange error in callback:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Redirect to dashboard if they somehow landed here but they are actually logged in already
  return NextResponse.redirect(`${origin}/dashboard`)
}
