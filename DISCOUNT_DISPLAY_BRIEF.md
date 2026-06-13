# Feature: Discount Display Mode in Print Templates

## Summary
Add a new print setting "Discount Display" that lets users choose how discounts appear in printed invoices/quotations:
- **"Amount"** (default): Shows discount as rupee amount (e.g., "-₹500.00") — current behavior
- **"Percentage"**: Shows discount as percentage (e.g., "10%") — NEW

This applies to:
1. **Per-item discount column** in the items table
2. **Invoice-level discount row** in the totals section

## Database Changes
Add a new column to the `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_discount_as VARCHAR(20) DEFAULT 'amount';
-- Valid values: 'amount' | 'percentage'
```

## Files to Modify

### 1. `src/types/print.ts` — Add field to Settings interface
In the `Settings` interface (around line 105-113), add:
```typescript
show_discount_as?: 'amount' | 'percentage'
```

### 2. `src/components/print/ModernTemplate.tsx` — Update discount display
- Import/IoPercentage icon not needed, just text-based
- **Item discount column** (around line 184-188): Change from always showing `₹{amount}` to conditional:
  - If `settings.show_discount_as === 'percentage'`: Show `{item.discount}%` (when discount > 0), else show `-`
  - If `settings.show_discount_as !== 'percentage'` (amount mode, default): Keep current behavior showing `₹{amount}`
  - Note: The `item.discount` field stores the discount PER ITEM. Currently it's treated as rupee amount. For percentage mode, assume item.discount stores the percentage value (e.g., 10 for 10%). If item.discount is 0 or undefined, show `-`.
- **Invoice discount row** (around line 328-335): Change label and value:
  - If percentage mode: Label "Addl. Discount", value shows `{data.discount}%` (the data.discount field stores the invoice-level discount value)
  - If amount mode (default): Keep current behavior showing `-₹{data.discount}`
  - IMPORTANT: The `data.discount` field on InvoiceData is currently shown as a rupee amount. In percentage mode, treat it as a percentage number.

### 3. `src/components/print/ElegantTemplate.tsx` — Same changes
- Item discount column (around line 168-172): Same logic as above
- Invoice discount row (around line 238-243): Same logic

### 4. `src/components/print/ClassicTemplate.tsx` — Same changes
- Item discount column header says "Disc%" already (line 162) — keep header as "Disc%" in amount mode too, or change to just "Disc"
- Item discount cell (line 193-196): Currently shows `{item.discount || 0}%` — this is wrong in amount mode. Fix:
  - Amount mode: Show `₹{(item.discount || 0).toLocaleString('en-IN')}`
  - Percentage mode: Show `{(item.discount || 0)}%`
- Invoice discount row (line 259-264): Same conditional logic

### 5. `src/components/print/ProfessionalTemplate.tsx` — Same changes
- Item discount column (line 155-159): Add conditional
- Invoice discount row (line 283-288): Add conditional. Note: this template already has some percentage logic `{data.discount > 0 && data.discount < 100 && data.discount % 1 !== 0 ? \`(${data.discount}%)\` : ''}` — simplify this.

### 6. `src/components/print/GSTInvoiceTemplate.tsx` — Same changes
- Item discount column (line 252-254): Currently shows `₹{tax.discount.toFixed(2)}` or `-`. Add conditional.
- Item discount header (line 220): Currently "Disc" — keep as is
- Invoice discount row (line 350-355): Add conditional

### 7. `src/components/print/CompactTemplate.tsx` — Same changes
- Item discount column (line 151-155): Add conditional
- Invoice discount row (line 263-268): Add conditional

### 8. `src/components/print/ThermalTemplate.tsx` — Same changes
- This is a receipt-style template. Keep it simple:
  - Invoice discount row (line 108-113): Add conditional to show either amount or percentage

### 9. `src/app/dashboard/settings/print/page.tsx` — Add toggle in settings UI
In the `settings` state (line 77-87), add:
```typescript
show_discount_as: 'amount',
```

In the `fetchSettings` function (line 98-117), add to the select and setSettings.

In the visibility toggles section (around line 308, after Custom Fields toggle), add a new ToggleField:
```typescript
<ToggleField
    icon={<IoSettings size={16} />}
    label="Show Discount as Percentage"
    active={settings.show_discount_as === 'percentage'}
    onChange={(v) => setSettings({ ...settings, show_discount_as: v ? 'percentage' : 'amount' })}
/>
```

Update the database save/update to include `show_discount_as`.

## Important Notes
- The `item.discount` field currently stores a number. In existing templates it's displayed as rupee amount in most templates (Modern, Elegant, Professional, Compact, GST) and as percentage in Classic. For this feature:
  - **Amount mode (default)**: Display item.discount as rupee amount: `₹{item.discount}`
  - **Percentage mode**: Display item.discount as percentage: `{item.discount}%`
- The `data.discount` field on InvoiceData (invoice-level discount) follows the same pattern.
- The `hasAnyDiscount` variable checks if any item has discount > 0, control visibility of the discount column — keep this logic unchanged.
- For the discount column header text, use "Disc" as it fits all modes.

## Verification
After implementation:
1. Run `npx tsc --noEmit` — zero errors
2. Run `git log --oneline -3` — verify no unintended commits
3. Do NOT git push
