# BillMensor Coupon System - SECURITY FIX Brief

## Problem
Currently ANY authenticated user can create/manage coupons. The coupon management page is in the user sidebar at /dashboard/settings/coupons. The /api/coupons POST endpoint only checks if user is logged in — not if they are admin. This means every user can generate unlimited premium coupons for themselves.

## What Needs to Change

### 1. Add admin credentials to .env.local

Add two new env vars to .env.local:
```
ADMIN_USERNAME=billmensor_admin
ADMIN_PASSWORD=billmensor@2026
```
(Pick these exact values — user can change later)

### 2. Create Admin Auth Middleware — src/lib/admin-auth.ts

Create a simple utility file:

```typescript
// src/lib/admin-auth.ts
export function verifyAdminCredentials(username: string, password: string): boolean {
    const adminUser = process.env.ADMIN_USERNAME || 'billmensor_admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'billmensor@2026';
    return username === adminUser && password === adminPass;
}

// For API routes: check Basic Auth header
export function isAdminRequest(req: Request): boolean {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) return false;
    const base64 = authHeader.split(' ')[1];
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');
    return verifyAdminCredentials(username, password);
}
```

### 3. OVERWRITE src/app/api/coupons/route.ts

The GET and POST endpoints must BOTH require admin auth using Basic Auth header.
- Get credentials from Authorization: Basic base64(username:password) header
- Use the verifyAdminCredentials function from src/lib/admin-auth.ts
- If not admin → return 403 Forbidden
- GET returns all coupons (admin only)
- POST creates coupon (admin only) — remove the Supabase user.id check, use admin auth instead

### 4. OVERWRITE src/app/api/coupons/validate/route.ts  

This one stays PUBLIC (anyone can validate before redeeming). NO admin check needed here.
But also accept admin credentials in Basic Auth header if provided — so admin can validate too.
No major changes, just keep it public.

### 5. OVERWRITE the admin coupon page to /src/app/admin/coupons/page.tsx

Key changes from the old page:
- NEW PATH: /admin/coupons (NOT /dashboard/settings/coupons)
- NO supabase.auth dependency — this page does NOT use Supabase auth at all
- Uses sessionStorage to persist admin login state within the browser tab
- On first load, show a LOGIN FORM (username + password fields)
- On login: verify credentials against /api/admin/validate endpoint (POST with {username, password})
- If valid, store sessionStorage.setItem('admin_auth', 'true') and show the coupon management UI
- On page load: if sessionStorage has admin_auth=true, skip login form
- Logout button clears sessionStorage and shows login form again
- All API calls (create coupon, list coupons, toggle active) must send Basic Auth header:
  fetch('/api/coupons', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(username + ':' + password)
    },
    body: JSON.stringify({...})
  })
- Store the admin credentials in component state (or sessionStorage) so they can be sent with each API call
- The rest of the UI stays the same (table, modal form, stats cards, expand redemptions, etc.)
- Use "use client" directive
- Style matches the dark theme of the app

### 6. Create /src/app/admin/page.tsx (simple redirect)

A simple page at /admin that redirects to /admin/coupons:
```tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function AdminPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/coupons'); }, []);
  return null;
}
```

### 7. Create /api/admin/validate/route.ts

Simple endpoint:
```typescript
import { NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/admin-auth';

export async function POST(req: Request) {
    const { username, password } = await req.json();
    if (verifyAdminCredentials(username, password)) {
        return NextResponse.json({ valid: true });
    }
    return NextResponse.json({ valid: false, error: 'Invalid admin credentials' }, { status: 401 });
}
```

### 8. Remove Coupons link from user sidebar

In src/components/layout/sidebar.tsx, REMOVE this line:
```
<SubLink href="/dashboard/settings/coupons" label="Coupons" onClick={closeMobileMenu} />
```
Users should NOT see any coupon management link.

### 9. Delete /src/app/dashboard/settings/coupons/page.tsx

Remove the old coupon management page from user settings entirely:
```
rm src/app/dashboard/settings/coupons/page.tsx
```

### 10. Update coupon service — src/services/coupon.ts

Update the createCoupon function to accept an optional auth header parameter so the admin page can pass Basic Auth:
```typescript
export async function createCoupon(data: Partial<Coupon>, adminAuthHeader?: string): Promise<{ success: boolean; error?: string; coupon?: Coupon }> {
    // ... existing code ...
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminAuthHeader) headers['Authorization'] = adminAuthHeader;
    
    const res = await fetch("/api/coupons", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({...}),
    });
    // ...
}
```

## Summary of File Changes

Files to CREATE:
- src/lib/admin-auth.ts (admin credential verification utility)
- src/app/admin/page.tsx (redirect to /admin/coupons)
- src/app/admin/coupons/page.tsx (NEW admin-only coupon management page with login)
- src/app/api/admin/validate/route.ts (validate admin credentials)

Files to OVERWRITE:
- src/app/api/coupons/route.ts (add Basic Auth admin check to GET and POST)

Files to MODIFY:
- .env.local (add ADMIN_USERNAME and ADMIN_PASSWORD)
- src/components/layout/sidebar.tsx (remove Coupons SubLink)
- src/services/coupon.ts (add optional adminAuthHeader param to createCoupon)

Files to DELETE:
- src/app/dashboard/settings/coupons/page.tsx (old user-facing coupon page)

Files to KEEP AS-IS (no changes needed):
- src/app/api/coupons/validate/route.ts (public — anyone can validate)
- src/app/api/coupons/redeem/route.ts (public — logged-in users redeem)
- src/app/dashboard/settings/billing/page.tsx (user coupon redemption UI stays)
- src/app/page.tsx (landing page coupon input stays)
- src/app/register/page.tsx (register coupon flow stays)

## Security Model

```
/admin            → redirect to /admin/coupons
/admin/coupons    → login form → Basic Auth → sessionStorage → coupon management
/api/admin/validate → POST {username, password} → validates against env vars
/api/coupons GET  → requires Basic Auth header → returns all coupons
/api/coupons POST → requires Basic Auth header → creates coupon
/api/coupons/validate POST → PUBLIC (anyone can check if coupon is valid)
/api/coupons/redeem POST → requires Supabase auth (logged-in user only)
```

ONLY you (the owner) who know the admin username/password can:
- List all coupons
- Create new coupons
- Activate/deactivate coupons
- See redemption details

Regular users can ONLY:
- Validate a coupon code (to check if it works)
- Redeem a coupon code (to get premium plan)
- Apply coupon at registration

## IMPORTANT RULES
- NEVER run git push
- Use .limit(1)+[0] instead of .maybeSingle()
- After ALL changes, run npx tsc --noEmit and fix errors
- After tsc passes, run git log --oneline -3 to verify no unintended commits
