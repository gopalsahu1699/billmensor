import React from 'react'
import { PrintTemplateProps } from '@/types/print'
import { BILLMENSOR_PROMO } from '@/lib/marketing'

export function ElegantTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type
}: PrintTemplateProps) {

    const isInvoice = type === 'invoice'
    const allGstIsZero = items.every(item => (item.tax_rate ?? 18) === 0)
    const hasAnyDiscount = items.some(item => (item.discount || 0) > 0)

    const accentColor = profile?.brand_color || '#6366f1'
    const companyName = profile?.company_name || 'Company Name'

    const showUPIQR = settings.show_upi_qr !== false && bankDetails?.upi_id && data.payment_status !== 'paid'
    const upiURL = bankDetails?.upi_id
        ? `upi://pay?pa=${bankDetails.upi_id}&pn=${encodeURIComponent(companyName)}&am=${data.balance_amount !== undefined ? data.balance_amount : data.total_amount}&cu=INR`
        : ''

    return (
        <div
            className="bg-white w-[210mm] mx-auto p-10 text-[13px] text-slate-700 leading-relaxed"
            style={{ fontFamily: profile?.font_family || 'Inter' }}
        >
            {/* HEADER: Logo LEFT, Company Details RIGHT */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    {profile?.logo_url ? (
                        <div className="h-14 w-44 mb-1">
                            <img
                                src={profile.logo_url}
                                alt={`${companyName} logo`}
                                className="w-full h-full object-contain object-left"
                            />
                        </div>
                    ) : (
                        <h1 className="text-[20px] font-bold" style={{ color: accentColor }}>
                            {companyName}
                        </h1>
                    )}
                </div>
                <div className="text-right text-[12px] text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">{companyName}</p>
                    <p>{profile?.address}</p>
                    <p>{profile?.state && `${profile.state}`}{profile?.gstin && ` | GSTIN: ${profile.gstin}`}</p>
                    <p>{profile?.phone && `Ph: ${profile.phone}`}{profile?.email && ` | ${profile.email}`}</p>
                </div>
            </div>

            {/* ACCENT COLOR BAR */}
            <div className="h-[3px] rounded-full mb-8" style={{ backgroundColor: accentColor }}></div>

            {/* INVOICE TITLE + NUMBER */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-[28px] font-light tracking-wide" style={{ color: accentColor }}>
                        {isInvoice ? 'INVOICE' : 'QUOTATION'}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-[13px] font-semibold" style={{ color: accentColor }}>
                        {isInvoice ? data.invoice_number : data.quotation_number}
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1">
                        {new Date(
                            (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
                        ).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {isInvoice && data.payment_status && (
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            data.payment_status === 'paid'
                                ? 'bg-green-50 text-green-600'
                                : data.payment_status === 'overdue'
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-amber-50 text-amber-600'
                        }`}>
                            {data.payment_status}
                        </span>
                    )}
                </div>
            </div>

            {/* CLIENT INFO - Light gray rounded box */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                            {isInvoice ? 'Bill To' : 'Quotation For'}
                        </p>
                        <p className="font-semibold text-[14px] text-slate-800">{data.customers?.name || 'N/A'}</p>
                        <p className="text-[12px] text-slate-500 whitespace-pre-line mt-1">
                            {data.billing_address || data.customers?.billing_address || 'N/A'}
                        </p>
                        <p className="text-[12px] text-slate-500 mt-1">
                            {data.billing_phone || data.customers?.billing_phone || data.customers?.phone || ''}
                        </p>
                        <p className="text-[12px] text-slate-500">
                            GSTIN: {data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin || 'N/A'}
                        </p>
                    </div>
                    {(data.shipping_address || data.customers?.shipping_address) && (
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Ship To</p>
                            <p className="font-semibold text-[14px] text-slate-800">{data.customers?.name}</p>
                            <p className="text-[12px] text-slate-500 whitespace-pre-line mt-1">
                                {data.shipping_address || data.customers?.shipping_address}
                            </p>
                            <p className="text-[12px] text-slate-500 mt-1">
                                {data.shipping_phone || data.customers?.shipping_phone || ''}
                            </p>
                            <p className="text-[12px] text-slate-500">
                                GSTIN: {data.shipping_gstin || data.customers?.shipping_gstin || 'N/A'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ITEMS TABLE - No vertical borders, only horizontal separators */}
            <div className="mb-8">
                <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr className="border-b-2" style={{ borderColor: accentColor }}>
                            <th className="text-left py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">#</th>
                            <th className="text-left py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Product</th>
                            <th className="text-center py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">HSN</th>
                            <th className="text-center py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Qty</th>
                            <th className="text-right py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Rate</th>
                            {hasAnyDiscount && (
                                <th className="text-right py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Disc</th>
                            )}
                            {!allGstIsZero && (
                                <th className="text-center py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">GST</th>
                            )}
                            <th className="text-right py-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 break-inside-avoid">
                                <td className="py-3 text-slate-400">{index + 1}</td>
                                <td className="py-3">
                                    <div className="flex items-center gap-3">
                                        {item.image_url && (
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                                                <img src={item.image_url} alt="" className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-800">{item.item_name || item.name}</p>
                                            {item.description && (
                                                <p className="text-[10px] text-slate-400 whitespace-pre-wrap">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 text-center text-slate-400">{item.hsn_code || '-'}</td>
                                <td className="py-3 text-center">{item.quantity}</td>
                                <td className="py-3 text-right text-slate-600">
                                    ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                                </td>
                                {hasAnyDiscount && (
                                    <td className="py-3 text-right text-slate-500">
                                        {(item.discount || 0) > 0 ? `₹${(item.discount || 0).toLocaleString('en-IN')}` : '-'}
                                    </td>
                                )}
                                {!allGstIsZero && (
                                    <td className="py-3 text-center text-slate-500">
                                        {item.tax_rate ?? 18}%
                                    </td>
                                )}
                                <td className="py-3 text-right font-semibold text-slate-800">
                                    ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TAX SUMMARY (bottom-left) + TOTALS (bottom-right) */}
            <div className="flex justify-between items-start mb-8">
                {/* Tax Summary */}
                {!allGstIsZero && (
                    <div className="bg-slate-50 rounded-xl p-4 text-[11px]">
                        <p className="font-semibold text-slate-500 mb-2 uppercase text-[10px] tracking-wider">Tax Summary</p>
                        <table className="text-[10px]">
                            <tbody>
                                {Object.values(items.reduce((acc, item) => {
                                    const rate = item.tax_rate ?? 18
                                    const taxable = item.total - (item.tax_amount || 0)
                                    const tax = item.tax_amount || 0
                                    const key = `${rate}`
                                    if (!acc[key]) acc[key] = { rate, taxable: 0, tax: 0 }
                                    acc[key].taxable += taxable
                                    acc[key].tax += tax
                                    return acc
                                }, {} as Record<string, { rate: number; taxable: number; tax: number }>)).map((t, i) => (
                                    <tr key={i}>
                                        <td className="py-1 pr-4 text-slate-500">CGST @{t.rate / 2}%</td>
                                        <td className="py-1 text-right font-medium">₹{(t.tax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {Object.values(items.reduce((acc, item) => {
                                    const rate = item.tax_rate ?? 18
                                    const tax = item.tax_amount || 0
                                    const key = `${rate}`
                                    if (!acc[key]) acc[key] = { rate, tax: 0 }
                                    acc[key].tax += tax
                                    return acc
                                }, {} as Record<string, { rate: number; tax: number }>)).map((t, i) => (
                                    <tr key={`sgst-${i}`}>
                                        <td className="py-1 pr-4 text-slate-500">SGST @{t.rate / 2}%</td>
                                        <td className="py-1 text-right font-medium">₹{(t.tax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                <tr className="border-t border-slate-200 mt-1">
                                    <td className="py-1 pr-4 font-semibold text-slate-700">Total Tax</td>
                                    <td className="py-1 text-right font-bold">₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Totals */}
                <div className="w-[260px] space-y-2">
                    <div className="flex justify-between text-[12px] text-slate-500">
                        <span>Subtotal</span>
                        <span>₹{(data.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {data.discount > 0 && (
                        <div className="flex justify-between text-[12px] text-green-600">
                            <span>Discount</span>
                            <span>-₹{(data.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {!allGstIsZero && (
                        <div className="flex justify-between text-[12px] text-slate-500">
                            <span>Tax (GST)</span>
                            <span>₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {(data.transport_charges || 0) > 0 && (
                        <div className="flex justify-between text-[12px] text-slate-500">
                            <span>Transport</span>
                            <span>₹{(data.transport_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(data.installation_charges || 0) > 0 && (
                        <div className="flex justify-between text-[12px] text-slate-500">
                            <span>Installation</span>
                            <span>₹{(data.installation_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {/* Grand Total with accent background */}
                    <div
                        className="flex justify-between items-center rounded-xl px-4 py-3 mt-3 text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        <span className="font-bold text-[13px] uppercase tracking-wider">Grand Total</span>
                        <span className="font-bold text-[18px]">
                            ₹{(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* UPI QR CODE (centered between bank details and totals) */}
            {showUPIQR && upiURL && (
                <div className="flex justify-center mb-8">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">Scan to Pay</p>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 inline-block">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(upiURL)}`}
                                alt="UPI QR Code"
                                className="w-[100px] h-[100px]"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{bankDetails?.upi_id}</p>
                    </div>
                </div>
            )}

            {/* BANK DETAILS */}
            {settings.show_bank_details && bankDetails && (
                <div className="bg-slate-50 rounded-xl p-5 mb-6 text-[11px]">
                    <p className="font-semibold text-slate-500 mb-2 uppercase text-[10px] tracking-wider">Bank Details</p>
                    <div className="grid grid-cols-3 gap-4 text-slate-600">
                        <p><span className="text-slate-400">A/C No:</span> {bankDetails.account_number}</p>
                        <p><span className="text-slate-400">IFSC:</span> {bankDetails.ifsc_code}</p>
                        <p><span className="text-slate-400">Bank:</span> {bankDetails.bank_branch_name}</p>
                    </div>
                </div>
            )}

            {/* TERMS */}
            {settings.show_terms && (
                <div className="mb-6 text-[10px] text-slate-400">
                    <p className="font-semibold text-slate-500 mb-1 uppercase text-[10px] tracking-wider">Terms & Conditions</p>
                    {profile?.terms_and_conditions ? (
                        <ol className="list-decimal pl-4 space-y-0.5">
                            {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
                                <li key={i}>{term.trim()}</li>
                            ))}
                        </ol>
                    ) : (
                        <p>Goods once sold will not be taken back. Subject to local jurisdiction.</p>
                    )}
                </div>
            )}

            {/* SIGNATURE - Bottom Right */}
            {settings.show_signature && (
                <div className="flex justify-end mt-8">
                    <div className="text-right">
                        {profile?.signature_url && (
                            <div className="mb-2">
                                <img
                                    src={profile.signature_url}
                                    alt="Signature"
                                    className="h-12 ml-auto object-contain"
                                />
                            </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 w-48 ml-auto">
                            <p className="text-[11px] font-medium text-slate-600">{companyName}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            )}

            {/* PROMO FOOTER */}
            <div className="mt-10 text-center pt-4" style={{ borderTop: `1px solid ${accentColor}20` }}>
                <p className="text-[9px] font-medium" style={{ color: accentColor }}>
                    {BILLMENSOR_PROMO}
                </p>
            </div>
        </div>
    )
}
