# Fix Total column in ProfessionalTemplate.tsx

File: C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

## Change

The "Total" column in the items table currently shows `item.total` which includes GST. The user wants the Total column to show the amount **without GST** (i.e., the taxable/pre-tax value).

### Line 168-170: Change Total column value

Current:
```tsx
<td className="border px-3 py-2 text-right font-medium">
    ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</td>
```

Change to:
```tsx
<td className="border px-3 py-2 text-right font-medium">
    ₹{((item.total || 0) - (item.tax_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</td>
```

This subtracts `item.tax_amount` from `item.total` to show the pre-tax line total.

### Also update the header on line 131

Current header just says "Total". Change it to "Total (excl. GST)" to make it clear:

Current:
```tsx
<th className="border px-3 py-2 text-right">Total</th>
```

Change to:
```tsx
<th className="border px-3 py-2 text-right">Total (excl. GST)</th>
```

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
