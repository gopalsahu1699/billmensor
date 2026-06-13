# Revert Total column to include GST in ProfessionalTemplate.tsx

File: C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

## Change: Total column should include GST (revert to original)

### Line 131: Change header back
Current:
```tsx
<th className="border px-3 py-2 text-right">Total (excl. GST)</th>
```
Change to:
```tsx
<th className="border px-3 py-2 text-right">Total</th>
```

### Line 168-170: Change value back to item.total (with GST)
Current:
```tsx
<td className="border px-3 py-2 text-right font-medium">
    ₹{((item.total || 0) - (item.tax_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</td>
```
Change to:
```tsx
<td className="border px-3 py-2 text-right font-medium">
    ₹{(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</td>
```

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
