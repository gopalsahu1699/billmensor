# Fix: Discount Display Calculation Logic

## Problem
The current discount display in print templates is broken because:
1. `item.discount` always stores the calculated rupee amount, but `item.discount_type` ('amount' | 'percent') is NOT stored in DB
2. `data.discount` stores the raw number (could be rupees or percentage), but `generalDiscountType` is NOT stored in DB
3. The `show_discount_as` print setting tries to toggle display, but doesn't know the original discount type

## Solution
Store the discount type alongside the discount value, and use it in templates to decide how to display.

## Step 1: Database Migration
Run this in Supabase SQL Editor:

```sql
-- Add discount_type to invoice_items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'amount';

-- Add discount_type to quotation_items
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'amount';

-- Add general_discount_type to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS general_discount_type VARCHAR(20) DEFAULT 'amount';

-- Add general_discount_type to quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS general_discount_type VARCHAR(20) DEFAULT 'amount';
```

## Step 2: Update Types

### `src/types/print.ts` — Update Item interface
Add `discount_type` field:
```typescript
export interface Item {
    item_name?: string
    name?: string
    hsn_code?: string
    quantity: number
    unit_price?: number
    rate?: number
    tax_rate?: number
    tax_amount?: number
    discount?: number
    discount_type?: 'amount' | 'percent'  // NEW
    total: number
    image_url?: string
    product_id?: string
    description?: string
}
```

### `src/types/print.ts` — Update InvoiceData interface
Add `general_discount_type` field:
```typescript
export interface InvoiceData {
    // ... existing fields ...
    discount: number
    general_discount_type?: 'amount' | 'percent'  // NEW
    // ... rest of fields ...
}
```

## Step 3: Update Create Invoice Page

### `src/app/dashboard/invoices/create/page.tsx`

#### 3a. Update InvoiceItem interface (around line 18-39)
Add `discount_type` field:
```typescript
interface InvoiceItem {
    // ... existing fields ...
    discount: number
    per_unit_discount: number
    discount_rate: number
    discount_type: 'amount' | 'percent'  // already exists in interface
    // ... rest ...
}
```

#### 3b. Update item discount storage in calculateItemTotals (around line 381-427)
Currently the function calculates `totalRowDiscount` and stores it in `updated.discount`. Also store the `discount_type`:
```typescript
// In calculateItemTotals, after calculating totalRowDiscount:
updated.discount = totalRowDiscount
updated.discount_type = updated.discount_type  // already set, just ensure it's preserved
```

#### 3c. Update save payload (around line 502-517)
Add `discount_type` to each item in the save payload:
```typescript
items: items.map(item => ({
    // ... existing fields ...
    discount: item.discount,
    discount_type: item.discount_type,  // NEW
    total: item.total,
    // ... rest ...
}))
```

#### 3d. Update general discount storage (around line 474-518)
Add `general_discount_type` to the invoice payload:
```typescript
const invoicePayload = {
    // ... existing fields ...
    discount: generalDiscount,
    general_discount_type: generalDiscountType,  // NEW
    // ... rest ...
}
```

#### 3e. Update edit mode loading (around line 257-281)
When loading items for edit, add `discount_type`:
```typescript
const mappedItems = (inv.invoice_items as DBInvoiceItem[]).map((item) => {
    const calculated = calculateItemTotals({
        // ... existing fields ...
        discount: item.discount || 0,
        per_unit_discount: (item as any).per_unit_discount || (item.quantity > 0 ? (item.discount || 0) / item.quantity : 0),
        discount_rate: (item as any).discount_rate || 0,
        discount_type: (item as any).discount_type || 'amount',  // NEW - read from DB
        // ... rest ...
    }, {})
    return calculated
})
```

Also load `general_discount_type` when loading the invoice for edit (around line 222-237):
```typescript
setGeneralDiscount(inv.discount || 0)
setGeneralDiscountType(inv.general_discount_type || 'amount')  // NEW
```

## Step 4: Update Create Quotation Page
Apply the same changes to `src/app/dashboard/quotations/create/page.tsx`:
- Add `discount_type` to item save payload
- Add `general_discount_type` to quotation save payload
- Load `discount_type` and `general_discount_type` in edit mode

## Step 5: Update Print Templates

For ALL 7 templates in `src/components/print/`, update the discount display logic:

### Per-item discount column display:
Instead of checking `settings.show_discount_as`, check `item.discount_type`:
```tsx
// OLD (broken):
{isPercentageMode
    ? ((item.discount || 0) > 0 ? `${item.discount}%` : '-')
    : ((item.discount || 0) > 0 ? `₹${(item.discount || 0).toLocaleString('en-IN')}` : '-')}

// NEW (correct):
{(item.discount || 0) > 0
    ? (item.discount_type === 'percent'
        ? `${item.discount_rate || 0}%`   // Show the percentage number user entered
        : `₹${(item.discount || 0).toLocaleString('en-IN')}`)  // Show calculated rupee amount
    : '-'
}
```

Note: `item.discount_rate` stores the original percentage number the user entered. If it's not available, fall back to showing the calculated rupee amount.

### Invoice-level discount row display:
Instead of checking `settings.show_discount_as`, check `data.general_discount_type`:
```tsx
// OLD (broken):
{isPercentageMode ? `${data.discount}%` : `-₹${(data.discount || 0).toLocaleString('en-IN')}`}

// NEW (correct):
{data.general_discount_type === 'percent'
    ? `${data.discount}%`  // data.discount stores the percentage number
    : `-₹${(data.discount || 0).toLocaleString('en-IN')}`  // data.discount stores the rupee amount
}
```

### Fallback for old records (no discount_type stored):
If `item.discount_type` is undefined/null, default to `'amount'` display (show rupees).
If `data.general_discount_type` is undefined/null, default to `'amount'` display.

## Step 6: Update Invoice/Quotations Detail Pages

### `src/app/dashboard/invoices/[id]/page.tsx`
When loading items, ensure `discount_type` is mapped:
```typescript
const mappedItems = (itemsData || []).map(item => ({
    ...item,
    image_url: item.image_url || (item.products as any)?.image_url,
    discount_type: item.discount_type || 'amount',  // ensure fallback
}))
```

### `src/app/dashboard/quotations/[id]/page.tsx`
Same change for quotation items.

## Step 7: Remove the broken `show_discount_as` setting
Since we now use the stored `discount_type` per item/invoice, the `show_discount_as` setting is no longer needed for templates. However, keep it in the Settings interface for backward compatibility — just don't use it in templates anymore.

## Verification
1. Run `npx tsc --noEmit` — zero errors
2. Run `git log --oneline -3` — verify no unintended commits
3. Do NOT git push
