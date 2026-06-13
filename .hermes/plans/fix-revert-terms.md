# Revert: Use single centralized terms_and_conditions from profile (simpler approach)

The user wants: whatever text is in the profile's `terms_and_conditions` field should appear on BOTH invoice and quotation prints. No separate fields needed.

## Step 1: Revert types — C:\auto_billmensor\src\types\print.ts

### Profile interface: Remove invoice_terms and quotation_terms, keep terms_and_conditions
Remove the `invoice_terms?: string` and `quotation_terms?: string` lines from Profile interface.
Keep only:
```
terms_and_conditions?: string
```

### Settings interface: Remove invoice_terms and quotation_terms
Remove the `invoice_terms?: string` and `quotation_terms?: string` lines from Settings interface.

## Step 2: Revert ProfessionalTemplate.tsx — C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

### Terms section: Change back to use profile.terms_and_conditions

Find the block that reads `settings.invoice_terms || settings.quotation_terms` and replace the entire `{settings.show_terms && (...)}` block with:

```tsx
{settings.show_terms && (
    <div>
        <p className="font-bold text-[14px] mb-2 uppercase tracking-tighter italic">Terms & Conditions:</p>
        <div className="text-[11px] leading-relaxed text-gray-600">
            {profile?.terms_and_conditions ? (
                <ul className="list-decimal pl-4 space-y-1">
                    {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
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

## Step 3: Revert CompactTemplate.tsx — C:\auto_billmensor\src\components\print\CompactTemplate.tsx

### Terms section: Change back to use profile.terms_and_conditions

Find the block that reads `settings.invoice_terms || settings.quotation_terms` and replace the entire `{settings.show_terms && (...)}` block with:

```tsx
{settings.show_terms && (
    <div>
        <h4 className="font-bold text-[12px] mb-1 uppercase bg-gray-50 px-2 py-0.5 border-l-2 border-black">Terms</h4>
        <div className="text-[10px] text-gray-600 italic">
            {profile?.terms_and_conditions ? (
                <ul className="list-disc pl-4 space-y-0.5">
                    {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
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

## Step 4: Revert ModernTemplate.tsx — C:\auto_billmensor\src\components\print\ModernTemplate.tsx

### Terms section: Change back to use profile.terms_and_conditions

Find the block that reads `settings.invoice_terms || settings.quotation_terms` and replace the entire `{settings.show_terms && (...)}` block with:

```tsx
{settings.show_terms && (
    <div className="px-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-2">
            General Terms & Conditions
        </p>
        <div className="text-[10px] text-slate-500 leading-relaxed italic">
            {profile?.terms_and_conditions ? (
                <ul className="list-disc pl-4 space-y-1">
                    {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
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

## Step 5: Revert Invoice detail page — C:\auto_billmensor\src\app\dashboard\invoices\[id]\page.tsx

### Remove invoice_terms and quotation_terms from setPrintSettings

Find and remove these two lines from the setPrintSettings call:
```
    invoice_terms: profileData.invoice_terms || '',
    quotation_terms: profileData.quotation_terms || '',
```

## Step 6: Revert Quotation detail page — C:\auto_billmensor\src\app\dashboard\quotations\[id]\page.tsx

### Remove invoice_terms and quotation_terms from setPrintSettings

Find and remove these two lines from the setPrintSettings call:
```
    invoice_terms: profData.invoice_terms || '',
    quotation_terms: profData.quotation_terms || '',
```

## Step 7: Revert Print Settings page — C:\auto_billmensor\src\app\dashboard\settings\print\page.tsx

### 7a. Remove invoice_terms and quotation_terms from settings state init
Remove:
```
    invoice_terms: '',
    quotation_terms: '',
```

### 7b. Remove from .select()
Remove `invoice_terms, quotation_terms` from the select string.

### 7c. Remove from fetch setSettings
Remove:
```
invoice_terms: data[0].invoice_terms || '',
quotation_terms: data[0].quotation_terms || '',
```

### 7d. Remove from updatePayload
Remove:
```
invoice_terms: settings.invoice_terms,
quotation_terms: settings.quotation_terms,
```

### 7e. Remove the entire Terms & Conditions editor section
Find and remove the entire `{/* Terms & Conditions Editors */}` div block (the one containing Invoice Terms and Quotation Terms textareas).

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
