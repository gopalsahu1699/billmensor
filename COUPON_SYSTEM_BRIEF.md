# BillMensor Coupon System - Implementation Brief

## Overview
Build a complete coupon/promo code system for BillMensor. The app is a Next.js 16 + Supabase billing application. Core billing is free; users pay only for cloud backup (monthly ₹199 / yearly ₹1,999 via Razorpay).

## What Already Exists (DO NOT RE-IMPLEMENT)
- `src/types/index.ts` — Coupon, CouponRedemption, CouponValidationResult types already added
- `supabase/migrations/001_create_coupons.sql` — Database migration SQL already written (user runs this in Supabase SQL Editor)
- `src/lib/supabase.ts` — Browser Supabase client
- `src/app/api/razorpay/order/route.ts` — Razorpay order creation
- `src/app/api/razorpay/verify/route.ts` — Razorpay payment verification + profile update
- `src/app/dashboard/settings/billing/page.tsx` — Existing billing page with Razorpay checkout
- `src/app/page.tsx` — Landing page with pricing section
- `src/components/PremiumGate.tsx` — Premium gate wrapper component
- Profile type has: plan_type ('free'|'monthly'|'yearly'), plan_status, plan_expiry

## What You Need to Build

### 1. Coupon Service — `src/services/coupon.service.ts`

Create a service file with these functions:

```typescript
import { supabase } from '@/lib/supabase'
import { Coupon, CouponValidationResult } from '@/types'

// Validate a coupon code for the current user
// Returns { valid: boolean, coupon?, error?, plan_type?, discount_percent? }
export async function validateCoupon(code: string): Promise<CouponValidationResult>

// Redeem a coupon — applies plan to user profile, records redemption
// Returns { success: boolean, error?, plan_type? }
export async function redeemCoupon(code: string): Promise<{ success: boolean; error?: string; plan_type?: string }>

// Get all coupons (admin)
export async function getAllCoupons(): Promise<Coupon[]>

// Create a coupon (admin)
export async function createCoupon(data: Partial<Coupon>): Promise<{ success: boolean; error?: string }>

// Deactivate a coupon (admin)
export async function deactivateCoupon(id: string): Promise<{ success: boolean; error?: string }>

// Get redemption stats for a coupon
export async function getCouponRedemptions(couponId: string): Promise<CouponRedemption[]>
```

**validateCoupon logic:**
1. Fetch coupon from `coupons` table where `code = upper(code)` and `is_active = true`
2. If not found → return `{ valid: false, error: 'Invalid coupon code' }`
3. Check `valid_from <= NOW()` → if not, return `{ valid: false, error: 'Coupon not yet active' }`
4. Check `valid_until` — if set and in past → return `{ valid: false, error: 'Coupon has expired' }`
5. Check `used_count < max_uses` → if not, return `{ valid: false, error: 'Coupon limit reached' }`
6. Check current user hasn't exceeded `per_user_limit` for this coupon (count from `coupon_redemptions`)
7. If all pass → return `{ valid: true, coupon, plan_type: coupon.plan_type, discount_percent: coupon.discount_percent }`

**redeemCoupon logic:**
1. Call validateCoupon first — if invalid, return the error
2. Get current user via `supabase.auth.getUser()`
3. Calculate plan_expiry based on plan_type:
   - 'lifetime' → plan_expiry = NULL (or 2099-12-31)
   - 'yearly' → NOW() + 1 year
   - 'monthly' → NOW() + 1 month
   - 'free' → no change
4. Insert into `coupon_redemptions` (coupon_id, user_id, plan_granted, payment_amount=0)
5. Update `profiles` table: set plan_type, plan_status='active', plan_expiry
6. If any error, return `{ success: false, error: message }`
7. Return `{ success: true, plan_type }`

### 2. API Route — `src/app/api/coupons/route.ts`

Two methods:

**GET** — List all coupons (for admin)
- Requires auth
- Returns all coupons with redemption count

**POST** — Create a new coupon (for admin)
- Body: { code, description, plan_type, discount_percent, max_uses, per_user_limit, valid_until? }
- Convert code to uppercase
- Insert into `coupons` table
- Return created coupon

### 3. API Route — `src/app/api/coupons/validate/route.ts`

**POST** — Validate a coupon
- Body: { code: string }
- Uses server-side Supabase client (createServerClient from @supabase/ssr)
- Returns { valid, error?, plan_type?, discount_percent? }

### 4. API Route — `src/app/api/coupons/redeem/route.ts`

**POST** — Redeem a coupon
- Body: { code: string }
- Uses server-side Supabase client
- Validates, then applies plan to user profile
- Records redemption in `coupon_redemptions`
- Returns { success, error?, plan_type? }

### 5. Update Billing Page — `src/app/dashboard/settings/billing/page.tsx`

Add a coupon redemption section ABOVE the existing plan cards:

```
┌─────────────────────────────────────────────┐
│  Have a promo code?                         │
│  [________________] [Apply]                 │
│  (shows validation result / success message)│
└─────────────────────────────────────────────┘
```

- Add state: `couponCode` (string), `couponLoading` (boolean), `couponResult` (null | { type: 'success'|'error', message: string })
- On Apply click: call `/api/coupons/validate` → if valid, show plan details and "Redeem" button
- On Redeem click: call `/api/coupons/redeem` → on success, show success toast and refresh profile
- Style matches existing page (dark theme, rounded corners, same color scheme)
- If user already has an active premium plan, show "You already have an active plan" instead of coupon input

### 6. Coupon Management Page — `src/app/dashboard/settings/coupons/page.tsx`

Admin-only page for managing coupons:

```
┌──────────────────────────────────────────────────────┐
│  Coupon Management                    [+ New Coupon] │
├──────────────────────────────────────────────────────┤
│  Code          │ Plan   │ Used │ Max │ Status │ ...  │
│  LIFETIME10    │ life   │ 3    │ 10  │ Active │ 🔴   │
│  YEARFREE50    │ yearly │ 12   │ 50  │ Active │ 🔴   │
│  INFLUENCER    │ life   │ 1    │ 1   │ Used   │ 🔴   │
└──────────────────────────────────────────────────────┘
```

Features:
- List all coupons in a table
- Show: code, plan_type, used_count/max_uses, valid_until, is_active
- "New Coupon" button opens a modal/form with fields: code, description, plan_type (dropdown), discount_percent, max_uses, per_user_limit, valid_until (date picker, optional)
- Deactivate button per coupon (toggle is_active)
- Click a coupon row to see redemption details (who redeemed it, when)
- Use existing UI components (Button, Card, Badge, etc.)
- Style matches the rest of the dashboard

### 7. Update Settings Navigation

Add a "Coupons" link/entry in the settings sidebar/navigation so admins can access the coupon management page at `/dashboard/settings/coupons`.

Check `src/app/dashboard/settings/page.tsx` and the settings layout to find where nav items are defined, then add:
```
{ label: 'Coupons', href: '/dashboard/settings/coupons', icon: <MdLocalOffer /> }
```

### 8. Update Landing Page — `src/app/page.tsx`

In the pricing section (id="pricing"), add a small coupon input between the heading and the plan cards:

```
┌─────────────────────────────────────┐
│  Have a coupon code?                │
│  [Enter code] [Apply]               │
└─────────────────────────────────────┘
```

- On successful validation, show: "Coupon valid! You get [plan_type] plan at [discount_percent]% off. Sign up to redeem!"
- Link the Sign Up button to `/register?coupon=CODE`
- Style matches the landing page aesthetic

### 9. Update Register Page — `src/app/register/page.tsx`

- Read `?coupon=CODE` from URL search params
- If coupon param exists, validate it via `/api/coupons/validate`
- If valid, show a banner: "Coupon [CODE] applied! You'll get [plan_type] after registration."
- After successful registration, auto-redeem the coupon (call `/api/coupons/redeem` right after signup)

## Important Rules
- NEVER run `git push` or any git remote commands
- Always use `.limit(1)` + array indexing instead of `.maybeSingle()` for Supabase queries
- Use the existing UI components from `src/components/ui/` (Button, Card, Badge, etc.)
- Match the existing dark theme / design system
- Use `sonner` for toast notifications (already used in the project)
- Use `react-icons/md` for icons (already used in the project)
- After ALL changes are done, run `npx tsc --noEmit` and fix any type errors
- After tsc passes, run `git log --oneline -3` to verify no unintended commits

## Coupon Types to Support
| Type | plan_type | discount_percent | Example |
|------|-----------|-----------------|---------|
| Lifetime free | 'lifetime' | 100 | LIFETIME10 |
| 1 Year free | 'yearly' | 100 | YEARFREE50 |
| Single use | any | 100 | INFLUENCER01 |
| Percentage off | 'yearly' | 50 | HALFOFF |
| Custom | any | any | CUSTOMCODE |

## File Checklist
- [ ] `src/services/coupon.service.ts`
- [ ] `src/app/api/coupons/route.ts`
- [ ] `src/app/api/coupons/validate/route.ts`
- [ ] `src/app/api/coupons/redeem/route.ts`
- [ ] `src/app/dashboard/settings/billing/page.tsx` (updated)
- [ ] `src/app/dashboard/settings/coupons/page.tsx` (new)
- [ ] Settings nav updated to include Coupons link
- [ ] `src/app/page.tsx` (updated - pricing section coupon input)
- [ ] `src/app/register/page.tsx` (updated - coupon from URL param)
- [ ] `npx tsc --noEmit` passes
- [ ] `git log --oneline -3` verified
