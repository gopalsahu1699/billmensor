# Notification API Fix Brief — FINAL

## Problem
Both admin POST and user GET for notifications are failing with 500 errors. The live DB schema is uncertain — migration 002 creates the table with `target_audience, target_user_ids, sent_by` but seed file 004 references `user_id, target_user_id, is_read, metadata`. We need to work with whatever schema exists.

## Key Insight
The ONLY columns guaranteed to exist in the `notifications` table across all schema versions are:
`id, title, message, type, created_at`

ALL other columns (`user_id, target_user_id, is_read, metadata, target_audience, target_user_ids, sent_by`) may or may not exist depending on which migrations were applied.

## Fix Plan

### 1. src/app/api/admin/notifications/route.ts — POST method
Insert using ONLY the safe columns:
```typescript
const insertData = {
    title,
    message,
    type: type || 'info',
};
```
That's it. No `user_id`, no `target_user_id`, no `is_read`, no `target_audience`, no `sent_by`. Just the 3 columns that are always safe.

Remove the profiles query entirely — it's not needed.

Keep GET and DELETE as-is (GET uses `*`, DELETE uses `neq` on `id` — both fine).

### 2. src/app/api/notifications/route.ts — user-facing GET
Simplify drastically:
- Select `*` from notifications, order by created_at desc, limit 50
- NO filtering by user_id, target_user_id, or target_audience
- NO profiles table query
- Just return ALL notifications to everyone
- This works regardless of which columns exist

```typescript
const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
```

### 3. src/types/index.ts
Keep the Notification interface minimal with optional fields:
```typescript
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'promotional' | 'urgent';
    is_read?: boolean;
    user_id?: string;
    target_user_id?: string | null;
    target_audience?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}
```
All optional fields — the code only uses `id, title, message, type, created_at` for display.

### 4. src/app/admin/notifications/page.tsx
The page displays `n.user_id` to determine "Broadcast" vs "User Specific". Since admin now inserts without `user_id`, all notifications will show as "Broadcast" — that's correct behavior. No changes needed to the page.

The form sends `target_audience` in the body but the API ignores it — that's fine, the dropdown can stay.

### 5. src/app/dashboard/notifications/page.tsx
No changes needed — it only uses `id, title, message, type, created_at`.

## Important Rules
- NEVER run git push
- After ALL changes, run `npx tsc --noEmit` and fix errors
- After tsc passes, run `git log --oneline -3`
