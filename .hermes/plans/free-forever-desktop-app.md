# BillMensor — Free Forever + Windows .exe + Cloud Backup Premium

## BUSINESS MODEL
- Billmensor web app is 100% FREE forever — all billing features unlimited
- Data is stored in cloud Supabase by default (free tier)
- User can download the Windows desktop app (.exe) — data stored locally via Tauri SQLite
- Cloud backup sync is a PAID premium feature (₹199/month or ₹1,999/year)
- If user is on free plan, they get everything EXCEPT cloud backup sync

## WHAT TO CHANGE

### 1. LANDING PAGE — src/app/page.tsx

#### A. Update Hero section
- Change "Get Started" CTA to "Get Started for Free"
- Add a second CTA button: "Download Windows App" with a download icon (MdDownload)
- This button links to a new `/download` page (which we'll create)

#### B. Update Pricing section (already exists at id="pricing")
The pricing is already well-structured (Free Core Billing + Monthly/Yearly Backup plans). Just update:
- Rename "Monthly Backup" to "Cloud Backup — Monthly"
- Rename "Yearly Backup" to "Cloud Backup — Yearly"  
- Add a note under the Free plan: "Works fully online + offline with Windows app"
- Add a new card/grid section ABOVE the existing pricing: **"Choose Your Setup"** with two options:
  1. **Online (Web)** — Free forever — Access from any device, data in cloud
  2. **Desktop (.exe)** — Free forever — Windows app, data stored locally + optional cloud backup

#### C. Add a new "Download" section between Features and Pricing
A prominent section with:
- Big Windows logo / icon
- Headline: "Download Billmensor for Windows"
- Subheadline: "Full-featured desktop app. Works offline. Data stored on YOUR machine."
- Download button linking to `/download`
- Note: "Cloud backup available as add-on premium feature"
- System requirements: Windows 10+, 200MB disk space

### 2. NEW DOWNLOAD PAGE — src/app/download/page.tsx

Create a download page that:
- Shows the Windows app download prominently
- Has a large "Download for Windows (.exe)" button
- Shows version number: "v1.0.0"
- Shows file size: "~100MB"
- System requirements section
- FAQ section:
  - "Is the desktop app free?" → Yes, 100% free
  - "Where is my data stored?" → Locally on your Windows machine
  - "Can I sync data to cloud?" → Yes, with Cloud Backup (₹199/month)
  - "Can I transfer data from web to desktop?" → Export from web, import to desktop
- Link to settings/billing page for cloud backup plan
- Call-to-action for web version too: "Or use Billmensor Online →"

### 3. UPDATE DASHBOARD — src/app/dashboard/page.tsx

Add a banner/card at the top of the dashboard (in the stats area or as a new row) that shows:

#### If user is on FREE plan (not subscribed to cloud backup):
```
┌─────────────────────────────────────────────────────┐
│  💻 Download Billmensor for Windows                │
│  Get the desktop app for offline access + local    │
│  data storage. Free forever.                       │
│                                                     │
│  [Download for Windows]  │  [Enable Cloud Backup] │
└─────────────────────────────────────────────────────┘
```

#### If user is on PAID plan (cloud backup active):
```
┌─────────────────────────────────────────────────────┐
│  ☁️ Cloud Backup Active — Protected                │
│  Your data is backed up daily.                     │
│  Plan: [Monthly/Yearly] | Expires: [date]          │
│   │  [Download for Windows]                       │
└─────────────────────────────────────────────────────┘
```

The dashboard already fetches profile data (line 71: `const [profile, setProfile] = useState<any>(null)`). Use `profile.plan_type` to determine which banner to show:
- `plan_type === 'free'` or not set → show Windows download + cloud backup upsell
- `plan_type === 'monthly'` or `'yearly'` → show active backup + Windows download

### 4. UPDATE NAVBAR — src/components/layout/navbar.tsx
(If it exists — check first. If not, check root layout.tsx for nav)
- Add a "Download" link in the navbar between "About" and the auth buttons
- Make it a subtle text link, not a button

### 5. UPDATE BILLING PAGE — src/app/dashboard/settings/billing/page.tsx
The billing page already shows cloud backup plans. Update it to also include:
- A section explaining the Windows desktop app
- "Download the Windows app" button regardless of plan status
- Clear explanation: 
  - Free users: Local data via desktop app + web app, no cloud sync
  - Paid users: Everything + automatic daily cloud backup

## IMPORTANT RULES

### Do NOT:
- Run `git push` or any git remote commands
- Break existing functionality (invoices, products, reports, etc.)
- Remove any existing features
- Add new npm packages without checking if they're already installed
- Modify Supabase schema or create new tables
- Change the Razorpay integration

### Do:
- Keep the existing dark theme styling (slate-900 bg, blue-600 accents, white text)
- Use existing UI components (Button from @/components/ui/button, Card etc.)
- Use existing icons from react-icons/md (MdDownload, MdComputer, MdCloud, MdShield, MdStorage)
- Use framer-motion for animations (already in use on landing page)
- Match the existing design language exactly
- Write TypeScript — all files are .tsx/.ts

### After completing:
- Run `npx tsc --noEmit` to verify no type errors
- Run `git diff --stat` to show what changed
- Run `git log --oneline -3` to confirm no unintended commits
