import os

base = 'C:/auto_billmensor/src/components/print/'

def apply_changes(filename, replacements):
    filepath = os.path.join(base, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for i, (old, new) in enumerate(replacements):
        if old in content:
            content = content.replace(old, new)
            print(f'  [{filename}] Change {i+1}: OK')
        else:
            print(f'  [{filename}] Change {i+1}: NOT FOUND')
            print(f'    Looking for: {repr(old[:80])}')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  [{filename}] Saved')

flag_old = 'const hasAnyDiscount = items.some(item => (item.discount || 0) > 0)'
flag_new = flag_old + "\n    const hasPercentDiscount = items.some(item => item.discount_type === 'percent' && (item.discount || 0) > 0)"

templates = {}

# ModernTemplate.tsx
templates['ModernTemplate.tsx'] = [
    (flag_old, flag_new),
    (
        '{hasAnyDiscount && <th className="px-2 pb-2 text-center">Disc</th>}',
        "{hasAnyDiscount && <th className=\"px-2 pb-2 text-center\">{hasPercentDiscount ? 'Disc%' : 'Disc'}}</th>}"
    ),
    (
        "₹{(item.discount || 0).toLocaleString('en-IN')}\n                                        </td>",
        "{item.discount_type === 'percent'\n                                            ? `${item.discount_rate ?? item.discount || 0}%`\n                                            : `₹${(item.discount || 0).toLocaleString('en-IN')}`}\n                                        </td>"
    ),
    (
        '<span>Addl. Discount</span>',
        "<span>Addl. Discount{data.general_discount_type === 'percent' ? ` (${data.discount}%)` : ''}</span>"
    ),
    (
        '-₹{data.discount.toLocaleString(\'en-IN\')}',
        "{data.general_discount_type === 'percent'\n                                    ? `-${data.discount}%`\n                                    : `-₹${data.discount.toLocaleString('en-IN')}`}"
    ),
]

# ProfessionalTemplate.tsx
templates['ProfessionalTemplate.tsx'] = [
    (flag_old, flag_new),
    (
        '{hasAnyDiscount && <th className="border px-3 py-2 text-center">Disc</th>}',
        "{hasAnyDiscount && <th className=\"border px-3 py-2 text-center\">{hasPercentDiscount ? 'Disc%' : 'Disc'}}</th>}"
    ),
    (
        "₹{(item.discount || 0).toLocaleString('en-IN')}\n                                </td>",
        "{item.discount_type === 'percent'\n                                    ? `${item.discount_rate ?? item.discount || 0}%`\n                                    : `₹${(item.discount || 0).toLocaleString('en-IN')}`}\n                                </td>"
    ),
    (
        '<span className="font-bold uppercase text-[11px]">Addl. Cash Discount {data.discount > 0 && data.discount < 100 && data.discount % 1 !== 0 ? `(${data.discount}%)` : \'\'}</span>',
        "<span className=\"font-bold uppercase text-[11px]\">Addl. Cash Discount{data.general_discount_type === 'percent' ? ` (${data.discount}%)` : ''}</span>"
    ),
    (
        '-₹{(data.discount || 0).toLocaleString(\'en-IN\')}',
        "{data.general_discount_type === 'percent'\n                            ? `-${data.discount}%`\n                            : `-₹${(data.discount || 0).toLocaleString('en-IN')}`}"
    ),
]

# ClassicTemplate.tsx
templates['ClassicTemplate.tsx'] = [
    (flag_old, flag_new),
    (
        "{hasAnyDiscount && (\n                                <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '50px' }}>Disc%</th>\n                            )}",
        "{hasAnyDiscount && (\n                                <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '50px' }}>{hasPercentDiscount ? 'Disc%' : 'Disc'}</th>\n                            )}"
    ),
    (
        "{item.discount || 0}%\n                                    </td>",
        "{item.discount_type === 'percent'\n                                        ? `${item.discount_rate ?? item.discount || 0}%`\n                                        : `₹${(item.discount || 0).toLocaleString('en-IN')}`}\n                                    </td>"
    ),
    (
        '-₹{(data.discount || 0).toLocaleString(\'en-IN\', { minimumFractionDigits: 2 })}\n                                    </tr>',
        "{data.general_discount_type === 'percent'\n                                        ? `-${data.discount}%`\n                                        : `-₹${(data.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}\n                                    </tr>"
    ),
]

# ElegantTemplate.tsx
templates['ElegantTemplate.tsx'] = [
    (flag_old, flag_new),
    (
        "{hasAnyDiscount && (\n                                <th className=\"text-right py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider\">Disc</th>\n                            )}",
        "{hasAnyDiscount && (\n                                <th className=\"text-right py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider\">{hasPercentDiscount ? 'Disc%' : 'Disc'}</th>\n                            )}"
    ),
    (
        "{(item.discount || 0) > 0 ? `₹${(item.discount || 0).toLocaleString('en-IN')}` : '-'}",
        "{item.discount_type === 'percent'\n                                            ? `${item.discount_rate ?? item.discount || 0}%`\n                                            : (item.discount || 0) > 0 ? `₹${(item.discount || 0).toLocaleString('en-IN')}` : '-'}"
    ),
    (
        '-₹{(data.discount || 0).toLocaleString(\'en-IN\', { minimumFractionDigits: 2 })}\n                        </div>',
        "{data.general_discount_type === 'percent'\n                            ? `-${data.discount}%`\n                            : `-₹${(data.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}\n                        </div>"
    ),
]

# CompactTemplate.tsx
templates['CompactTemplate.tsx'] = [
    (flag_old, flag_new),
    (
        '{hasAnyDiscount && <th className="py-2 text-center">Disc</th>}',
        "{hasAnyDiscount && <th className=\"py-2 text-center\">{hasPercentDiscount ? 'Disc%' : 'Disc'}}</th>}"
    ),
    (
        "₹{(item.discount || 0).toLocaleString('en-IN')}\n                                </td>",
        "{item.discount_type === 'percent'\n                                    ? `${item.discount_rate ?? item.discount || 0}%`\n                                    : `₹${(item.discount || 0).toLocaleString('en-IN')}`}\n                                </td>"
    ),
    (
        '-₹{(data.discount || 0).toLocaleString(\'en-IN\')}\n                        </div>',
        "{data.general_discount_type === 'percent'\n                            ? `-${data.discount}%`\n                            : `-₹${(data.discount || 0).toLocaleString('en-IN')}`}\n                        </div>"
    ),
]

# GSTInvoiceTemplate.tsx
templates['GSTInvoiceTemplate.tsx'] = [
    (flag_old, flag_new),
    (
        "<th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '45px' }}>Disc</th>",
        "<th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '45px' }}>{hasPercentDiscount ? 'Disc%' : 'Disc'}</th>"
    ),
    (
        "{tax.discount > 0 ? `₹${tax.discount.toFixed(2)}` : '-'}\n                                    </td>",
        "{item.discount_type === 'percent'\n                                        ? `${item.discount_rate ?? item.discount || 0}%`\n                                        : tax.discount > 0 ? `₹${tax.discount.toFixed(2)}` : '-'}\n                                    </td>"
    ),
    (
        '-₹{(data.discount || 0).toLocaleString(\'en-IN\', { minimumFractionDigits: 2 })}\n                                    </tr>',
        "{data.general_discount_type === 'percent'\n                                        ? `-${data.discount}%`\n                                        : `-₹${(data.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}\n                                    </tr>"
    ),
]

# ThermalTemplate.tsx
templates['ThermalTemplate.tsx'] = [
    (
        '<span>-₹{(data.discount || 0).toFixed(2)}</span>',
        "<span>{data.general_discount_type === 'percent' ? `-${data.discount}%` : `-₹${(data.discount || 0).toFixed(2)}`}</span>"
    ),
]

for filename, replacements in templates.items():
    print(f'\nProcessing {filename}:')
    apply_changes(filename, replacements)

print('\n\n=== ALL DONE ===')
