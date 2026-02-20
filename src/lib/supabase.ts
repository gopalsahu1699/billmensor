import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
    console.warn('Supabase credentials are not set in .env.local. Please update them with your actual Project URL and Anon Key.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

