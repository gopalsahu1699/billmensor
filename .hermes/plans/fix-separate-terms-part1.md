# Part 1: Separate Terms & Conditions — Types + Templates

## Step 1: Update types — C:\auto_billmensor\src\types\print.ts

### Profile interface: After line 9, add two new fields
Line 9 currently:
```
    terms_and_conditions?: string
```
After it add:
```
    invoice_terms?: string
    quotation_terms?: string
```

### Settings interface: After `show_discount_as` line, add two new fields
Find:
```
    show_discount_as?: 'amount' | 'percentage'
```
After it add:
```
    invoice_terms?: string
    quotation_terms?: string
```

## Step 2: Update ProfessionalTemplate.tsx — C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

### Replace the terms & conditions section (around lines 248-262)

Find the block that reads `profile?.terms_and_conditions` and replace the entire `{settings.show_terms && (...)}` block with:

```tsx
{settings.show_terms && (
    <div>
        <p className="font-bold text-[14px] mb-2 uppercase tracking-tighter italic">Terms & Conditions:</p>
        <div className="text-[11px] leading-relaxed text-gray-600">
            {settings.invoice_terms || settings.quotation_terms ? (
                <ul className="list-decimal pl-4 space-y-1">
                    {(settings.invoice_terms || settings.quotation_terms || '').split('\n').filter(t => t.trim()).map((term, i) => (
                        <li key={i}>{term.trim()}</li>
                    ))}
                </ul>
            ) : (
                <p>1. Goods once sold will not be taken back.</p>
            )}
        </div>
    </div>
)}
```

## Step 3: Update CompactTemplate.tsx — C:\auto_billmensor\src\components\print\CompactTemplate.tsx

### Replace the terms & conditions section (around lines 224-238)

Find the block that reads `profile?.terms_and_conditions` and replace the entire `{settings.show_terms && (...)}` block with:

```tsx
{settings.show_terms && (
    <div>
        <h4 className="font-bold text-[12px] mb-1 uppercase bg-gray-50 px-2 py-0.5 border-l-2 border-black">Terms</h4>
        <div className="text-[10px] text-gray-600 italic">
            {settings.invoice_terms || settings.quotation_terms ? (
                <ul className="list-disc pl-4 space-y-0.5">
                    {(settings.invoice_terms || settings.quotation_terms || '').split('\n').filter(t => t.trim()).map((term, i) => (
                        <li key={i}>{term.trim()}</li>
                    ))}
                </ul>
            ) : (
                <p>Goods once sold will not be taken back.</p>
            )}
        </div>
    </div>
)}
```

## Step 4: Update ModernTemplate.tsx — C:\auto_billmensor\src\components\print\ModernTemplate.tsx

### Replace the terms & conditions section (around lines 275-292)

Find the block that reads `profile?.terms_and_conditions` and replace the entire `{settings.show_terms && (...)}` block with:

```tsx
{settings.show_terms && (
    <div className="px-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-2">
            General Terms & Conditions
        </p>
        <div className="text-[10px] text-slate-500 leading-relaxed italic">
            {settings.invoice_terms || settings.quotation_terms ? (
                <ul className="list-disc pl-4 space-y-1">
                    {(settings.invoice_terms || settings.quotation_terms || '').split('\n').filter(t => t.trim()).map((term, i) => (
                        <li key={i}>{term.trim()}</li>
                    ))}
                </ul>
            ) : (
                <p>Certified that the particulars given above are true and correct.</p>
            )}
        </div>
    </div>
)}
```

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
