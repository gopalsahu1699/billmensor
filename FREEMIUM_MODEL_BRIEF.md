# BillMensor Freemium Model - Complete Implementation Brief

## Your Business Model
- ALL features (invoices, quotations, products, customers, reports, etc.) are FREE for everyone — no feature gating
- Users pay ONLY for CLOUD BACKUP (₹199/month or ₹1,999/year)
- FREE users get LOCAL STORAGE (data saved in browser via IndexedDB/localStorage)
- After 3 months, FREE user data stored in Supabase is auto-deleted
- Premium users get cloud backup of all their data (products, invoices, quotations, etc.)
- Free users see a banner at top of dashboard: "You have not subscribed — your data is stored locally"

## What Needs to Change

### 1. Remove PremiumGate from all pages
The existing PremiumGate component blocks free users from premium features. Since ALL features are now free, this component should be removed from everywhere it's used.

Search for all files using PremiumGate and remove the wrapper — just render children directly.

### 2. Dashboard Banner for Free Users
In the dashboard layout (dashboard-layout.tsx or navbar.tsx), add a banner at the top:
- If user is FREE: Show amber/orange banner with cloud_off icon
  Message: "You are on the Free plan — data is stored locally. Subscribe for cloud backup."
  Button: "Upgrade" → links to /dashboard/settings/billing
- If user is PREMIUM: Show green banner
  Message: "Cloud backup active — expires [date]"
  Small, dismissible

### 3. Backup Page — Split into Local vs Cloud
Current backup page at src/app/dashboard/settings/backup/page.tsx only does cloud backup.

New behavior:
- PREMIUM users: Show cloud backup UI (create backup, download, restore from Supabase storage)
- FREE users: Show local backup UI
  - "Export Data" button → downloads all user data as JSON file
  - "Import Data" button → upload JSON file to restore
  - Show info: "Your data is stored in your browser. Download backups regularly."
  - Show warning: "Your Supabase data older than 3 months will be automatically deleted."

### 4. Local Storage Service
Create a new service: src/services/local-storage.service.ts

This service handles saving/retrieving user data from IndexedDB for free users.

Key functions:
- `saveLocalData(userId, dataType, data)` — save data to IndexedDB
- `getLocalData(userId, dataType)` — retrieve data from IndexedDB
- `getAllLocalData(userId)` — get all user data
- `clearLocalData(userId)` — clear all local data
- `exportLocalData(userId)` — export all data as JSON string
- `importLocalData(userId, jsonData)` — import from JSON string

Use the `idb` library (already installed as dependency of supabase) or use IndexedDB directly.

### 5. Data Sync Logic
Modify all data services (invoice.service.ts, product.service.ts, etc.) to:

For FREE users:
- Save data to BOTH Supabase AND local IndexedDB
- When reading, try Supabase first, fall back to local if Supabase fails
- Show a sync indicator: "Saved locally" with cloud_off icon

For PREMIUM users:
- Save to Supabase only (cloud-backed)
- Show "Synced to cloud" with cloud icon

### 6. Auto-Delete Old Data for Free Users
Create a server-side function that runs daily (Supabase pg_cron or Edge Function):
- Find all free users whose plan_type = 'free' and created_at > 90 days ago
- Delete their data from Supabase tables: invoices, customers, products, purchases, quotations, etc.
- Keep their profile row (so they can still login)
- After deletion, they'll have only their local data

Since setting up pg_cron requires database access, create the SQL migration file:
supabase/migrations/003_auto_delete_free_user_data.sql

And also create a client-side check: when a free user loads data, check if their Supabase data was deleted, and if so, show a notice: "Your cloud data was cleaned up after 3 months. Your local data is still available."

### 7. Billing Page Update
Update src/app/dashboard/settings/billing/page.tsx:
- Clearer messaging: "All features are free. Cloud Backup is the only paid feature."
- Show what cloud backup includes: products, invoices, quotations, purchases, customers, reports
- Free tier info: "Free Forever — All features + local data storage"
- Premium tier info: "Cloud Backup — Everything in Free + automatic cloud backup + multi-device sync"

### 8. Update Profile Type
Add field to Profile type:
- `data_retention_days?: number` — for free users, track when data was last synced
- `last_backup_at?: string` — track last backup time

### 9. Sidebar Update
Remove "NEW" badges from features that were previously premium (Sales Orders, Purchase Orders, Cash Flow, Cheques, etc.) — all features are free now.
Keep the sidebar structure the same, just remove premium indicators.

## Files to Modify

1. Remove PremiumGate from all pages that use it
2. src/app/dashboard/layout.tsx or navbar.tsx — add subscription banner
3. src/app/dashboard/settings/backup/page.tsx — split local vs cloud
4. src/app/dashboard/settings/billing/page.tsx — update messaging
5. src/components/layout/sidebar.tsx — remove NEW badges, update labels
6. src/types/index.ts — add new fields to Profile
7. supabase/migrations/002_create_notifications.sql — add data_retention_days, last_backup_at to profiles

## Files to Create
1. src/services/local-storage.service.ts — IndexedDB service
2. supabase/migrations/003_auto_delete_free_user_data.sql — data cleanup SQL

## Important Rules
- NEVER git push
- Use .limit(1)+[0] not .maybeSingle()
- After ALL changes, run npx tsc --noEmit and fix errors
- After tsc passes, run git log --oneline -3
- Keep dark theme styling consistent
