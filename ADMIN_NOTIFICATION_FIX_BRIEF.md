# Admin Notification Fix Brief

## Problem
Admin cannot send notifications to users. The notification system has a **schema mismatch** between the actual database columns and what the code uses.

## Actual DB Schema (from migrations/002_create_notifications.sql)
The `notifications` table has these columns:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `title` TEXT NOT NULL
- `message` TEXT NOT NULL
- `type` TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'promotional', 'urgent'))
- `target_audience` TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'premium', 'free', 'selected'))
- `target_user_ids` UUID[] DEFAULT '{}'
- `sent_by` TEXT DEFAULT 'admin'
- `created_at` TIMESTAMPTZ DEFAULT NOW()

## What Code Currently Uses (WRONG)
The code uses columns that DON'T EXIST: `user_id`, `target_user_id` (singular), `is_read`, `metadata`

## Files to Fix

### 1. src/app/api/admin/notifications/route.ts
**GET**: Currently works (selects all columns with `*`), but the data shape is wrong for the frontend. No changes needed to the query itself.

**POST**: Currently inserts `{ title, message, type, target_user_id: null, is_read: false, user_id: senderId }` — ALL these extra columns don't exist. Fix to:
- Insert `{ title, message, type, target_audience, sent_by: 'admin' }`
- `target_audience` comes from the request body (already sent as `target_audience` from the form)
- Remove the code that fetches profiles for senderId — not needed
- Remove `user_id`, `target_user_id`, `is_read`, `metadata` from insert data
- Keep `.select()` and return the created notification

**DELETE**: No changes needed.

### 2. src/app/api/notifications/route.ts (user-facing API)
Currently queries with `.or('user_id.eq.${user.id},target_user_id.is.null')` using non-existent columns. Fix to:
- Get user from Supabase auth (already done)
- Get user's `plan_type` from the `profiles` table using `.select('plan_type').limit(1)` (use limit(1)+[0], NOT .maybeSingle())
- Build query: select from notifications where:
  - `target_audience = 'all'` — always show
  - OR `target_audience = 'premium'` AND user's plan_type != 'free'
  - OR `target_audience = 'free'` AND user's plan_type = 'free'
- Use `.or()` with the correct column name `target_audience`
- Order by `created_at` desc, limit 50
- Return `{ notifications: data || [] }`

### 3. src/app/admin/notifications/page.tsx
- The form already sends `target_audience` correctly — no change needed there
- The `Notification` type import uses `user_id` and `target_user_id` which don't exist — the page renders `n.user_id` and `n.type` etc. 
- Update the history table: instead of checking `n.user_id` to show "User Specific" vs "Broadcast", check `n.target_audience` to show the target audience label
- Remove references to `n.user_id` in the JSX (line 316, 333)
- The `type` field exists in the DB so that's fine

### 4. src/types/index.ts
Update the `Notification` interface (around line 610) to match actual DB:
```typescript
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'promotional' | 'urgent';
    target_audience?: string;
    target_user_ids?: string[];
    sent_by?: string;
    created_at: string;
}
```
Remove `user_id`, `target_user_id`, `is_read`, `metadata` from the interface.

### 5. src/app/dashboard/notifications/page.tsx
- The user-side page fetches from `/api/notifications` which will now return correct data
- The `Notification` type will be updated, so remove any references to `n.user_id`, `n.is_read`, `n.target_user_id`
- The page currently only uses `id, title, message, type, created_at` which is fine

## Important Rules
- NEVER run git push
- Use `.limit(1)` + array indexing `[0]`, NOT `.maybeSingle()`
- After ALL changes, run `npx tsc --noEmit` and fix any errors
- After tsc passes, run `git log --oneline -3`
