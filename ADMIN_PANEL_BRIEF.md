# BillMensor Professional Admin Panel - Full Implementation Brief

## Current State
- Admin auth exists at src/lib/admin-auth.ts (Basic Auth via env vars)
- Admin login page at /admin/coupons with sessionStorage-based session
- Existing admin validate API at /api/admin/validate/route.ts
- Coupon management page exists but needs to be redesigned as part of the larger admin panel
- No admin layout/dashboard shell exists yet

## What We're Building
A complete admin panel at /admin/* with a professional dashboard layout, sidebar navigation, and multiple sections for managing the entire application.

## Admin Panel Structure

```
/admin/dashboard          → Overview with key metrics
/admin/users              → User management (list, filter, search, view details)
/admin/users/[id]         → Individual user detail page
/admin/coupons            → Coupon management (existing, needs redesign)
/admin/notifications      → Send notifications to users
/admin/settings           → Admin settings (change password, app config)
/admin/api-management     → Manage API keys and Razorpay settings (view only)
/admin/reports            → Application-wide reports & analytics
```

## Detailed Page Specifications

### 1. Admin Layout — src/app/admin/layout.tsx

Create a new layout file for all admin pages (wraps around all /admin/* pages):

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR                        │  MAIN CONTENT AREA        │
│                                 │                           │
│  [Logo] Billmensor Admin        │  (page content here)      │
│                                 │                           │
│  ┌─ Dashboard                   │                           │
│  ├─ Users                       │                           │
│  ├─ Coupons                     │                           │
│  ├─ Notifications               │                           │
│  ├─ Reports                     │                           │
│  ├─ API Management              │                           │
│  └─ Settings                    │                           │
│                                 │                           │
│  ─────────────────────────────  │                           │
│  [Admin: billmensor_admin]      │                           │
│  [Logout]                       │                           │
│                                 │                           │
└─────────────────────────────────────────────────────────────┘
```

Requirements:
- "use client" directive
- Check sessionStorage for admin_auth on mount — if not logged in, redirect to a login page
- Sidebar is collapsible on mobile (hamburger menu)
- Dark theme matching the app (bg-slate-950, border-slate-800)
- Active page highlighting in sidebar
- Fix: Must wrap children with the sidebar + main content area

### 2. Admin Login Page — src/app/admin/login/page.tsx

Centered login card:
- Logo + "Billmensor Admin" title
- Username input, Password input
- Login button → POST to /api/admin/validate
- On success: sessionStorage.setItem('admin_auth','true'), sessionStorage.setItem('admin_user', username), sessionStorage.setItem('admin_pass', password), redirect to /admin/dashboard
- On failure: toast.error('Invalid credentials')
- Dark theme, professional styling

### 3. Admin Dashboard (Overview) — src/app/admin/page.tsx and src/app/admin/dashboard/page.tsx

/admin should redirect to /admin/dashboard (or just show dashboard at /admin)

Key metrics cards:
- Total Users (count from profiles table)
- Premium Users (plan_type != 'free')
- Active Premium (plan_status = 'active')
- Expiring Soon (plan_expiry within 30 days)
- Total Coupons
- Total Redemptions

Charts/Visualizations:
- Bar chart: Users by plan type (free, monthly, yearly, lifetime)
- Line chart: User registrations over time (last 30 days)
- Recent users table (last 10 registered)

Use the existing Supabase client to fetch data server-side or client-side with admin auth.
All admin API calls use Basic Auth header.

### 4. Admin Users List — src/app/admin/users/page.tsx

Features:
- Table of ALL users from profiles table
- Columns: Name, Email, Company, Plan Type, Plan Status, Expiry Date, Registered Date
- Search bar (search by name, email, company)
- Filters: Plan Type dropdown (all/free/monthly/yearly/lifetime), Plan Status (all/active/expired/canceled)
- Pagination (20 users per page)
- Row click → navigate to /admin/users/[id]
- Export to CSV button
- Each row has action buttons: View Details, Send Notification, Change Plan (dropdown)
- "Change Plan" action: inline dropdown to change user's plan_type, plan_status, plan_expiry — calls admin API

Admin API needed: PATCH /api/admin/users/[id] — update user profile (admin-only, Basic Auth)

### 5. Admin User Detail — src/app/admin/users/[id]/page.tsx

Show full profile details:
- All profile fields (name, email, company, phone, gstin, address, etc.)
- Plan info with expiry countdown
- Action buttons:
  - Change Plan (modal with plan_type, plan_status, plan_expiry fields)
  - Send Notification (redirect to notification page with user pre-selected)
  - Delete User (with confirmation modal)
  - Impersonate/View as User (optional: link to user's dashboard)
- Activity timeline (recent invoices, payments — if data available)

### 6. Admin Coupons — src/app/admin/coupons/page.tsx (OVERWRITE existing)

Keep existing functionality but restyle to match new admin layout:
- Stats cards: Total, Active, Redemptions, Remaining
- Coupons table with expand rows for redemptions
- Create coupon modal
- Activate/Deactivate toggle
- All API calls use Basic Auth header from sessionStorage

### 7. Admin Notifications — src/app/admin/notifications/page.tsx

Features:
- Send notification to: All users / Selected users / Premium only / Free only
- Notification types: Info, Warning, Promotional, Urgent
- Form: Title, Message, Type, Target audience selector
- Preview card showing how notification looks
- Send button → stores notification in Supabase `notifications` table
- Notification history table (past notifications sent)

Database migration needed:
```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'promotional', 'urgent')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'premium', 'free', 'selected')),
    target_user_ids UUID[] DEFAULT '{}',
    sent_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

User-facing: users see a notification bell icon in their dashboard navbar that fetches unread notifications.

API: POST /api/admin/notifications — create notification (admin API, Basic Auth)

### 8. Admin Reports — src/app/admin/reports/page.tsx

Application-wide analytics:
- Revenue estimation (count of monthly users × 199 + yearly users × 1999)
- User growth chart (registrations per month)
- Plan distribution pie chart
- Coupon usage stats
- Top companies by user count
- Expiring subscriptions list (next 30 days)
- Export report as CSV/PDF button

### 9. Admin Settings — src/app/admin/settings/page.tsx

- Change admin password (updates .env.local conceptually — or just show instructions)
- View current admin username
- App info: version, environment (test/prod)
- Razorpay status (show if keys are configured)
- Danger zone: Clear all notifications, reset coupon usage stats

### 10. Admin API Management — src/app/admin/api-management/page.tsx

View-only page showing:
- Razorpay Key ID (masked)
- Supabase URL (masked)
- API usage stats (if available)
- Webhook configuration status

## API Routes to Create

All admin APIs are at /api/admin/* and require Basic Auth header.

1. **GET /api/admin/users** — List all users (profiles table), with pagination, search, filter
   - Query params: page, limit, search, plan_type, plan_status
   - Returns: { users: Profile[], total: number, page: number, totalPages: number }

2. **GET /api/admin/users/[id]** — Get single user profile

3. **PATCH /api/admin/users/[id]** — Update user plan/type/status/expiry
   - Body: { plan_type?, plan_status?, plan_expiry? }

4. **DELETE /api/admin/users/[id]** — Delete user (cascade to all their data)

5. **GET /api/admin/stats** — Dashboard stats
   - Returns: { totalUsers, premiumUsers, activePremium, expiringSoon, totalCoupons, totalRedemptions }

6. **POST /api/admin/notifications** — Create notification
   - Body: { title, message, type, target_audience, target_user_ids? }

7. **GET /api/admin/notifications** — List sent notifications

## Types to Add to src/types/index.ts

```typescript
export interface AdminStats {
    totalUsers: number
    premiumUsers: number
    activePremium: number
    expiringSoon: number
    totalCoupons: number
    totalRedemptions: number
}

export interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'promotional' | 'urgent'
    target_audience: 'all' | 'premium' | 'free' | 'selected'
    target_user_ids?: string[]
    sent_by: string
    created_at: string
}

export interface UserFilter {
    search?: string
    plan_type?: string
    plan_status?: string
    page?: number
    limit?: number
}
```

## Important Rules
- NEVER run git push
- Use .limit(1)+[0] instead of .maybeSingle()
- All admin pages use Basic Auth from sessionStorage (admin_user, admin_pass)
- Every admin API call must include: 'Authorization': 'Basic ' + btoa(username + ':' + password)
- Match the dark theme (bg-slate-950, text-white, border-slate-800)
- Use existing UI components from src/components/ui/
- Use sonner for toasts
- Use react-icons/md for icons
- After ALL changes, run npx tsc --noEmit and fix errors
- After tsc passes, run git log --oneline -3

## File Checklist

New files to create:
- [ ] src/app/admin/layout.tsx
- [ ] src/app/admin/login/page.tsx
- [ ] src/app/admin/page.tsx (redirect to dashboard)
- [ ] src/app/admin/dashboard/page.tsx
- [ ] src/app/admin/users/page.tsx
- [ ] src/app/admin/users/[id]/page.tsx
- [ ] src/app/admin/notifications/page.tsx
- [ ] src/app/admin/reports/page.tsx
- [ ] src/app/admin/settings/page.tsx
- [ ] src/app/admin/api-management/page.tsx
- [ ] src/app/api/admin/users/route.ts
- [ ] src/app/api/admin/users/[id]/route.ts
- [ ] src/app/api/admin/stats/route.ts
- [ ] src/app/api/admin/notifications/route.ts
- [ ] supabase/migrations/002_create_notifications.sql

Files to OVERWRITE:
- [ ] src/app/admin/coupons/page.tsx (restyle to match new admin layout)
- [ ] src/types/index.ts (add AdminStats, Notification, UserFilter types)
