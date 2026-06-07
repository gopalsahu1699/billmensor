# User Notification System - Implementation Brief

## Problem
The navbar has a MdNotifications bell icon button but it doesn't do anything — no click handler, no notification page. Users need to see notifications sent by admin.

## What to Build

### 1. User Notification Page — src/app/dashboard/notifications/page.tsx

Create a new page at /dashboard/notifications where users can see all notifications sent to them.

Features:
- Fetch notifications from Supabase `notifications` table
- Filter notifications relevant to the current user (target_audience = 'all' OR matches user's plan_type)
- Display as a list with date-wise grouping (group by date: Today, Yesterday, This Week, Older)
- Show notification type badge (info/warning/promotional/urgent) with color coding
- Show title, message, and time for each notification
- Mark notifications as "read" when viewed (optional)
- Empty state when no notifications exist
- Dark theme matching the app

### 2. Update Navbar — src/components/layout/navbar.tsx

Update the MdNotifications button (around line 53-56):
- Make it a Link or add onClick to navigate to /dashboard/notifications
- Show a red badge with unread count (fetch unread count from API)
- On click, navigate to the notification page

### 3. User Notification API — src/app/api/notifications/route.ts

Create a new public API endpoint:
- GET /api/notifications — Fetch notifications for the current user
  - Get user from Supabase auth
  - Get user's plan_type from profiles table
  - Return notifications where:
    - target_audience = 'all'
    - OR target_audience = 'premium' AND user's plan_type != 'free'
    - OR target_audience = 'free' AND user's plan_type = 'free'
  - Order by created_at desc
  - Limit to 50 most recent

### 4. Add Unread Count Badge

In the navbar, show a small red badge with the number of unread notifications.
- Fetch count from the API
- Display as a small circle with the number
- Hide if count is 0

## Styling
- Match the existing dark theme (bg-slate-950, border-slate-800, white text)
- Use Card, Badge components from src/components/ui/
- Use MdNotifications, MdInfo, MdWarning, MdCampaign, MdLocalOffer icons
- Date-wise grouping with section headers

## Important Rules
- NEVER git push
- Use .limit(1)+[0] not .maybeSingle()
- After ALL changes, run npx tsc --noEmit and fix errors
- After tsc passes, run git log --oneline -3
