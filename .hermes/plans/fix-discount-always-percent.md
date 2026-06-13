# Change discount column to always show percentage in ProfessionalTemplate.tsx

File: C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

## Change: Discount column should ALWAYS display as percentage

Currently the discount column shows `X%` for percent-type items and `₹X` for amount-type items. Change it to ALWAYS show as a percentage.

### Lines 160-166: Replace the discount cell

Current:
```tsx
{hasAnyDiscount && (
    <td className="border px-3 py-2 text-center">
        {item.discount_type === 'percent'
        ? `${(item.discount_rate ?? item.discount ?? 0)}%`
        : `₹${(item.discount || 0).toLocaleString('en-IN')}`}
    </td>
)}
```

Change to:
```tsx
{hasAnyDiscount && (
    <td className="border px-3 py-2 text-center">
        {(() => {
            if (item.discount_type === 'percent') {
                return `${(item.discount_rate ?? item.discount ?? 0)}%`;
            }
            // Convert amount discount to percentage of line amount (MRP × Qty)
            const lineAmount = (item.unit_price || item.rate || 0) * (item.quantity || 0);
            const discAmt = item.discount || 0;
            if (lineAmount > 0 && discAmt > 0) {
                return `${((discAmt / lineAmount) * 100).toFixed(2)}%`;
            }
            return `${discAmt}%`;
        })()}
    </td>
)}
```

Logic:
- If `discount_type === 'percent'`: show `discount_rate` as `%` (existing behavior)
- If `discount_type === 'amount'` (or anything else): calculate `(discount_amount / (unit_price × qty)) * 100` and show as `XX.XX%`
- Fallback: if line amount is 0, just show the raw discount value with `%`

### Line 130: Update discount column header

Current:
```tsx
{hasAnyDiscount && <th className="border px-3 py-2 text-center">Discount</th>}
```

Change to:
```tsx
{hasAnyDiscount && <th className="border px-3 py-2 text-center">Disc (%)</th>}
```

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
