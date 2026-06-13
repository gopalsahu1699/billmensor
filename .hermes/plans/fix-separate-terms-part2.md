# Part 2: Separate Terms & Conditions — Detail Pages + Settings Page

## Step 1: Update Invoice detail page — C:\auto_billmensor\src\app\dashboard\invoices\[id]\page.tsx

### In setPrintSettings (around lines 80-90), add invoice_terms and quotation_terms

Find the setPrintSettings call that starts with:
```tsx
setPrintSettings({
    print_template: profileData.print_template || 'modern',
```

Add these two lines before the closing `})`:
```tsx
    invoice_terms: profileData.invoice_terms || '',
    quotation_terms: profileData.quotation_terms || '',
```

## Step 2: Update Quotation detail page — C:\auto_billmensor\src\app\dashboard\quotations\[id]\page.tsx

### In setPrintSettings (around lines 70-80), add invoice_terms and quotation_terms

Find the setPrintSettings call that starts with:
```tsx
setPrintSettings({
    print_template: profData.print_template || 'modern',
```

Add these two lines before the closing `})`:
```tsx
    invoice_terms: profData.invoice_terms || '',
    quotation_terms: profData.quotation_terms || '',
```

## Step 3: Update Print Settings page — C:\auto_billmensor\src\app\dashboard\settings\print\page.tsx

### 3a. Lines 59-70: Add to settings state

In the useState initialization, add:
```tsx
    invoice_terms: '',
    quotation_terms: '',
```

### 3b. Around line 83: Update the .select() to include new fields

Current:
```ts
.select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields, show_discount_as')
```

Change to:
```ts
.select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields, show_discount_as, invoice_terms, quotation_terms')
```

### 3c. In setSettings after fetch (around lines 90-101), add:

```tsx
invoice_terms: data[0].invoice_terms || '',
quotation_terms: data[0].quotation_terms || '',
```

### 3d. In updatePayload (around lines 121-132), add:

```tsx
invoice_terms: settings.invoice_terms,
quotation_terms: settings.quotation_terms,
```

### 3e. After the last ToggleField block (after line 317), add T&C editor section:

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

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
