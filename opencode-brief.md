You need to update all 7 print templates in C:\auto_billmensor\src\components\print\ to show discount as percentage when item.discount_type === 'percent'.

## Data Model
Each item has:
- discount?: number — the discount value
- discount_type?: 'amount' | 'percent' — determines display
- discount_rate?: number — the percentage rate

The invoice/quotation data has:
- general_discount_type?: 'amount' | 'percent' — for the additional/total discount row

## For EACH of these 7 files, make the changes below:
1. ModernTemplate.tsx
2. ProfessionalTemplate.tsx
3. ClassicTemplate.tsx
4. ElegantTemplate.tsx
5. CompactTemplate.tsx
6. GSTInvoiceTemplate.tsx
7. ThermalTemplate.tsx

## Changes per file:

### 1. Add hasPercentDiscount flag near existing hasAnyDiscount:
const hasPercentDiscount = items.some(item => item.discount_type === 'percent' && (item.discount || 0) > 0)

### 2. Update "Disc" column header to show "Disc%" when any item uses percentage:
Change: {hasAnyDiscount && <th ...>Disc</th>}
To: {hasAnyDiscount && <th ...>{hasPercentDiscount ? 'Disc%' : 'Disc'}</th>}

### 3. Update discount cell in table body to show percentage or amount:
Replace the discount <td> content with:
{item.discount_type === 'percent'
    ? `${item.discount_rate ?? item.discount || 0}%`
    : `₹${(item.discount || 0).toLocaleString('en-IN')}`}

### 4. Update the Additional Discount / Addl. Discount / Discount row in totals section:
For the data.discount > 0 block, change to check data.general_discount_type:
- Label: Add `(${data.discount}%)` after the label when general_discount_type === 'percent'
- Value: Show `-{data.discount}%` when general_discount_type === 'percent', else keep `-₹{...}`

## Rules:
- Keep ALL existing styling/classes intact
- If discount_type is undefined or 'amount', keep showing ₹ format (backward compatible)
- Do NOT touch GST/tax columns
- After ALL changes, run: cd C:\auto_billmensor && npx tsc --noEmit
- Fix any TypeScript errors
- Do NOT run git push
