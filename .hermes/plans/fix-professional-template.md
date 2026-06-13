# Fix ProfessionalTemplate.tsx

File: C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

## Bugs to fix

### 1. Line 2: Remove unused import
Remove `import { MdEdit } from 'react-icons/md'` — it's never used.

### 2. Line 5: Remove unused import
Remove `import QRCode from 'react-qr-code'` — `upiURL` is computed but `QRCode` component is never rendered anywhere in the template.

### 3. Line 129: Invalid JSX `<P>` tag inside `<th>`
The header has `<P> MRP * Qty</P>` — uppercase `<P>` is not a valid HTML element and will render as an unknown tag. Change it to a `<span className="block text-[10px] font-normal text-gray-400">MRP × Qty</span>`.

### 4. Line 158: NaN bug — multiplying two `.toLocaleString()` strings
Current code:
```
₹{(item.unit_price || item.rate || 0) .toLocaleString('en-IN') * (item.quantity || 0).toLocaleString('en-IN')}
```
This calls `.toLocaleString()` on each number first (producing comma-separated strings like "1,000"), then multiplies them, resulting in `NaN`. Fix: calculate the raw number first, then format:
```
₹{((item.unit_price || item.rate || 0) * (item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
```

### 5. Lines 160-162: Duplicate "Total" column
There are TWO columns showing `item.total`:
- Line 160-162: `<td ...>₹{(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`
- Line 171-173: `<td ...>₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`

The column on lines 160-162 is the "Amount" column (MRP × Qty) but it's showing `item.total` (which is the final line total after discount/tax). Remove lines 160-162 entirely — the "Amount" column is already correctly calculated on lines 157-158 (after fixing bug #4).

### 6. Line 130: Discount column header doesn't handle mixed discount types
Current: `{hasPercentDiscount ? 'Disc%' : 'Disc'}` — if ANY item has percent discount, ALL discount cells show "Disc%" even for amount-type items. Since individual items already show their own type correctly (line 165-167), change the header to just "Discount".

### 7. Line 18: `item.discount` vs `item.discount_rate` inconsistency
The `hasAnyDiscount` check on line 18 uses `item.discount` but the discount display on line 166 uses `item.discount_rate ?? item.discount`. Update line 18 to also check `discount_rate`:
```
const hasAnyDiscount = items.some(item => (item.discount || 0) > 0 || (item.discount_rate || 0) > 0)
```

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
