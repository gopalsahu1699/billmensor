# Add this to your .env.local file (one line, no quotes around the key):

# Supabase Service Role Key (for admin APIs only - keeps RLS bypass)
# Get this from: Supabase Dashboard > Project Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# IMPORTANT: After adding, restart your dev server (npm run dev)
# The service role key is SECRET - never expose it to the client/browser
