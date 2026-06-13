# Add Terms & Conditions field to Print Settings page (single field, used for both invoice and quotation)

The profile table already has a `terms_and_conditions` field. The templates already read from `profile.terms_and_conditions`. The problem is there's NO way to edit this field from the UI.

## Fix: Add a single Terms & Conditions textarea to Print Settings page

### C:\auto_billmensor\src\app\dashboard\settings\print\page.tsx

#### 1. Add terms_and_conditions to settings state init (after line 69)

Current:
```tsx
show_discount_as: 'amount' as 'amount' | 'percentage',
invoice_terms: '',
quotation_terms: '',
```

Replace with:
```tsx
show_discount_as: 'amount' as 'amount' | 'percentage',
terms_and_conditions: '',
```

#### 2. Update .select() to include terms_and_conditions (around line 85)

Current:
```ts
.select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields, show_discount_as, invoice_terms, quotation_terms')
```

Change to:
```ts
.select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields, show_discount_as, terms_and_conditions')
```

#### 3. Add terms_and_conditions to fetch setSettings (around line 102)

Current:
```tsx
invoice_terms: data[0].invoice_terms || '',
quotation_terms: data[0].quotation_terms || '',
```

Replace with:
```tsx
terms_and_conditions: data[0].terms_and_conditions || '',
```

#### 4. Add terms_and_conditions to updatePayload (around line 136)

Current:
```tsx
invoice_terms: settings.invoice_terms,
quotation_terms: settings.quotation_terms,
```

Replace with:
```tsx
terms_and_conditions: settings.terms_and_conditions,
```

#### 5. Replace the entire Terms & Conditions editor section (around lines 325-353)

Find the entire `{/* Terms & Conditions Editors */}` div block and replace it with a single simpler section:

```tsx
{/* Terms & Conditions */}
<div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
        <IoDocument size={16} className="text-blue-500" />
        Terms & Conditions
    </h2>
    <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Terms & Conditions (for Invoices & Quotations)</label>
        <textarea
            value={settings.terms_and_conditions}
            onChange={(e) => setSettings({ ...settings, terms_and_conditions: e.target.value })}
            placeholder="Enter terms and conditions (one per line)..."
            rows={6}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
        />
        <p className="text-[9px] text-slate-400 mt-2">Each line will appear as a separate bullet point on your invoices and quotations.</p>
    </div>
</div>
```

#### 6. Remove old separate invoice/quotation terms from types

In C:\auto_billmensor\src\types\print.ts, remove `invoice_terms` and `quotation_terms` from both Profile and Settings interfaces if they were added previously.

#### 7. Revert templates to use profile.terms_and_conditions

In all 3 templates (ProfessionalTemplate, CompactTemplate, ModernTemplate), ensure the terms section reads from `profile?.terms_and_conditions` (not `settings.invoice_terms`).

The templates should have:
```tsx
{profile?.terms_and_conditions ? (
    <ul>
        {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
            <li key={i}>{term.trim()}</li>
        ))}
    </ul>
) : (
    <p>Default terms...</p>
)}
```

#### 8. Remove invoice_terms and quotation_terms from detail pages

In both invoices/[id]/page.tsx and quotations/[id]/page.tsx, remove any `invoice_terms` and `quotation_terms` from setPrintSettings calls.

The templates will get terms from `profile?.terms_and_conditions` which is already passed via the `profile` prop.

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
