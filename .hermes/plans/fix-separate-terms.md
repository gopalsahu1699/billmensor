# Separate Terms & Conditions for Invoice vs Quotation (remove centralized single T&C)

Currently all templates use `profile.terms_and_conditions` — a single centralized field.
The user wants separate T&C for invoices and quotations, configurable independently in Print Settings.

## Approach
1. Add `invoice_terms` and `quotation_terms` to the Profile type and Settings type
2. Update all 3 print templates to read terms from `settings` (not `profile`)
3. Update invoice detail page to pass `invoice_terms` into settings
4. Update quotation detail page to pass `quotation_terms` into settings
5. Update print settings page to have separate T&C editors for invoice and quotation

---

## Step 1: Update types — C:\auto_billmensor\src\types\print.ts

### Profile interface (after line 9, add two new fields):
Current line 9:
```
    terms_and_conditions?: string
```
After it add:
```
    invoice_terms?: string
    quotation_terms?: string
```

### Settings interface (after line 116 `show_discount_as`, add two new fields):
Current:
```
    show_discount_as?: 'amount' | 'percentage'
```
After it add:
```
    invoice_terms?: string
    quotation_terms?: string
```

---

## Step 2: Update ProfessionalTemplate.tsx — C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx

### Lines 248-262: Replace the terms & conditions section

Current:
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

Change to:
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

---

## Step 3: Update CompactTemplate.tsx — C:\auto_billmensor\src\components\print\CompactTemplate.tsx

### Lines 224-238: Replace the terms & conditions section

Current:
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

Change to:
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

---

## Step 4: Update ModernTemplate.tsx — C:\auto_billmensor\src\components\print\ModernTemplate.tsx

### Lines 275-292: Replace the terms & conditions section

Current:
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

Change to:
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

---

## Step 5: Update Invoice detail page — C:\auto_billmensor\src\app\dashboard\invoices\[id]\page.tsx

### Lines 80-90: Add invoice_terms to setPrintSettings

Current:
```tsx
setPrintSettings({
    print_template: profileData.print_template || 'modern',
    show_bank_details: profileData.show_bank_details ?? true,
    show_terms: profileData.show_terms ?? true,
    show_signature: profileData.show_signature ?? true,
    show_custom_fields: profileData.show_custom_fields ?? true,
    show_upi_qr: profileData.show_upi_qr ?? true,
    show_transport: profileData.show_transport ?? true,
    show_installation: profileData.show_installation ?? true,
    show_discount_as: profileData.show_discount_as ?? 'amount',
})
```

Change to:
```tsx
setPrintSettings({
    print_template: profileData.print_template || 'modern',
    show_bank_details: profileData.show_bank_details ?? true,
    show_terms: profileData.show_terms ?? true,
    show_signature: profileData.show_signature ?? true,
    show_custom_fields: profileData.show_custom_fields ?? true,
    show_upi_qr: profileData.show_upi_qr ?? true,
    show_transport: profileData.show_transport ?? true,
    show_installation: profileData.show_installation ?? true,
    show_discount_as: profileData.show_discount_as ?? 'amount',
    invoice_terms: profileData.invoice_terms || '',
    quotation_terms: profileData.quotation_terms || '',
})
```

---

## Step 6: Update Quotation detail page — C:\auto_billmensor\src\app\dashboard\quotations\[id]\page.tsx

### Lines 70-80: Add quotation_terms to setPrintSettings

Current:
```tsx
setPrintSettings({
    print_template: profData.print_template || 'modern',
    show_bank_details: profData.show_bank_details ?? true,
    show_terms: profData.show_terms ?? true,
    show_signature: profData.show_signature ?? true,
    show_custom_fields: profData.show_custom_fields ?? true,
    show_upi_qr: profData.show_upi_qr ?? true,
    show_transport: profData.show_transport ?? true,
    show_installation: profData.show_installation ?? true,
    show_discount_as: profData.show_discount_as ?? 'amount',
})
```

Change to:
```tsx
setPrintSettings({
    print_template: profData.print_template || 'modern',
    show_bank_details: profData.show_bank_details ?? true,
    show_terms: profData.show_terms ?? true,
    show_signature: profData.show_signature ?? true,
    show_custom_fields: profData.show_custom_fields ?? true,
    show_upi_qr: profData.show_upi_qr ?? true,
    show_transport: profData.show_transport ?? true,
    show_installation: profData.show_installation ?? true,
    show_discount_as: profData.show_discount_as ?? 'amount',
    invoice_terms: profData.invoice_terms || '',
    quotation_terms: profData.quotation_terms || '',
})
```

---

## Step 7: Update Print Settings page — C:\auto_billmensor\src\app\dashboard\settings\print\page.tsx

### Lines 59-70: Add invoice_terms and quotation_terms to settings state

Current:
```tsx
const [settings, setSettings] = useState({
    print_template: 'modern',
    paper_size: 'a4',
    show_transport: true,
    show_installation: true,
    show_bank_details: true,
    show_upi_qr: true,
    show_terms: true,
    show_signature: true,
    show_custom_fields: true,
    show_discount_as: 'amount' as 'amount' | 'percentage',
})
```

Change to:
```tsx
const [settings, setSettings] = useState({
    print_template: 'modern',
    paper_size: 'a4',
    show_transport: true,
    show_installation: true,
    show_bank_details: true,
    show_upi_qr: true,
    show_terms: true,
    show_signature: true,
    show_custom_fields: true,
    show_discount_as: 'amount' as 'amount' | 'percentage',
    invoice_terms: '',
    quotation_terms: '',
})
```

### Lines 83-101: Update fetchSettings to load new fields

Current select:
```ts
.select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields, show_discount_as')
```

Change to:
```ts
.select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields, show_discount_as, invoice_terms, quotation_terms')
```

And in the setSettings after fetch, add:
```tsx
invoice_terms: data[0].invoice_terms || '',
quotation_terms: data[0].quotation_terms || '',
```

### Lines 121-132: Update save payload

In the updatePayload object, add:
```tsx
invoice_terms: settings.invoice_terms,
quotation_terms: settings.quotation_terms,
```

### After line 317 (after the last ToggleField), add two new textarea fields for T&C editing:

Insert after the last ToggleField block (after line 317):

```tsx
{/* Terms & Conditions Editors */}
<div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
        <IoDocument size={16} className="text-blue-500" />
        Terms & Conditions
    </h2>
    <div className="space-y-4">
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Invoice Terms</label>
            <textarea
                value={settings.invoice_terms}
                onChange={(e) => setSettings({ ...settings, invoice_terms: e.target.value })}
                placeholder="Enter terms for invoices (one per line)..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
            />
        </div>
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quotation Terms</label>
            <textarea
                value={settings.quotation_terms}
                onChange={(e) => setSettings({ ...settings, quotation_terms: e.target.value })}
                placeholder="Enter terms for quotations (one per line)..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
            />
        </div>
    </div>
</div>
```

---

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
