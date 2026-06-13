# Task: Show discount as percentage in print templates

## Problem
In all 7 invoice/quotation print templates, the discount column currently always shows ₹ amount format, even when the discount is stored as a percentage (`discount_type === 'percent'`). Need to display percentage values when `item.discount_type === 'percent'`.

## Data Model (from `src/types/print.ts`)
Each item has these relevant fields:
- `discount?: number` — the discount value (amount or percentage number)
- `discount_type?: 'amount' | 'percent'` — determines display format
- `discount_rate?: number` — the percentage rate (use this when type is 'percent')

## Changes Needed in ALL 7 templates
Files to modify:
1. `src/components/print/ModernTemplate.tsx`
2. `src/components/print/ProfessionalTemplate.tsx`
3. `src/components/print/ClassicTemplate.tsx`
4. `src/components/print/ElegantTemplate.tsx`
5. `src/components/print/CompactTemplate.tsx`
6. `src/components/print/GSTInvoiceTemplate.tsx`
7. `src/components/print/ThermalTemplate.tsx`

### For each template, make these exact changes:

#### A. Compute `hasPercentDiscount` flag (add near existing `hasAnyDiscount`)
```tsx
const hasPercentDiscount = items.some(item => item.discount_type === 'percent' && (item.discount || 0) > 0)
```

#### B. Update table header label
Change the "Disc" column header from just "Disc" to conditionally show "Disc%" when any item uses percentage:
```tsx
{hasAnyDiscount && <th ...>{hasPercentDiscount ? 'Disc%' : 'Disc'}</th>}
```

#### C. Update table body discount cell
Replace the discount display cell to check `item.discount_type`:

**Before (example from ModernTemplate):**
```tsx
{hasAnyDiscount && (
    <td className="px-2 py-2 text-center text-slate-600">
        ₹{(item.discount || 0).toLocaleString('en-IN')}
    </td>
)}
```

**After:**
```tsx
{hasAnyDiscount && (
    <td className="px-2 py-2 text-center text-slate-600">
        {item.discount_type === 'percent'
            ? `${item.discount_rate ?? item.discount || 0}%`
            : `₹${(item.discount || 0).toLocaleString('en-IN')}`}
    </td>
)}
```

#### D. Update Additional Discount / Addl. Discount row in totals section
Wherever the template shows `data.discount > 0` in the totals area, also handle percentage display. Look for `data.discount_type` or `data.general_discount_type`:

**Before:**
```tsx
{data.discount > 0 && (
    <div ...>
        <span>Additional Disc:</span>
        <span>-₹{(data.discount || 0).toLocaleString('en-IN')}</span>
    </div>
)}
```

**After:**
```tsx
{data.discount > 0 && (
    <div ...>
        <span>
            Additional Disc {data.general_discount_type === 'percent' ? `(${data.discount}%)` : ''}:
        </span>
        {data.general_discount_type === 'percent'
            ? <span>-{data.discount}%</span>
            : <span>-₹{(data.discount || 0).toLocaleString('en-IN')}</span>}
    </div
)}
```

Note: For the totals-level discount, use `data.general_discount_type` field from the InvoiceData interface (some templates may need to also check `data.discount_type` as fallback).

## Important Notes
- Keep ALL existing styling/classes intact — only change the text content
- If `discount_type` is undefined or `'amount'`, keep showing ₹ format (backward compatible)
- Preserve all existing column widths, padding, and layout
- Do NOT touch GST/tax columns — only discount-related cells
- After ALL changes, run `npx tsc --noEmit` and fix any errors
- Do NOT run `git push`

## Verification
After implementation, verify:
1. Templates compile without errors (`npx tsc --noEmit`)
2. Discount shows as "10%" when `discount_type === 'percent'`
3. Discount shows as "₹100" when `discount_type === 'amount'` (or undefined)
4. Totals section shows percentage format for additional discount when applicable
