# Remove rounded corners from outer template wrappers on invoice and quotation detail pages

## Invoice detail page: C:\auto_billmensor\src\app\dashboard\invoices\[id]\page.tsx

### Line 381: Professional template wrapper
Current:
```tsx
<div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
```
Change to:
```tsx
<div className="bg-white border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
```

### Line 392: Compact template wrapper
Current:
```tsx
<div className="bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
```
Change to:
```tsx
<div className="bg-white border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
```

### Line 414 (ModernTemplate wrapper) — no wrapper div, ModernTemplate itself uses Card with rounded-4xl
The ModernTemplate is rendered directly at line 414 without a wrapper div. The rounded corners come from inside ModernTemplate.tsx line 29 which we already fixed (rounded-4xl → rounded-none). No extra change needed here.

## Quotation detail page: C:\auto_billmensor\src\app\dashboard\quotations\[id]\page.tsx

### Line 403: Professional template wrapper
Current:
```tsx
<div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
```
Change to:
```tsx
<div className="bg-white border border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none">
```

### Line 414: Compact template wrapper
Current:
```tsx
<div className="bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
```
Change to:
```tsx
<div className="bg-white border border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
```

### Line 436 (ModernTemplate) — same as invoice, no wrapper div. Already fixed in ModernTemplate.tsx.

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
