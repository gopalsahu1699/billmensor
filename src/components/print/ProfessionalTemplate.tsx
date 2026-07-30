import React from 'react'

import { PrintTemplateProps } from '@/types/print'
import { BILLMENSOR_PROMO } from '@/lib/marketing'


export function ProfessionalTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type
}: PrintTemplateProps) {

    const isInvoice = type === 'invoice'
    const allGstIsZero = items.every(item => (item.tax_rate ?? 18) === 0)
    const hasAnyDiscount = items.some(item => (item.discount || 0) > 0 || (item.discount_rate || 0) > 0)
    const hasPercentDiscount = items.some(item => item.discount_type === 'percent' && (item.discount || 0) > 0)

    const brandColor = profile?.brand_color || '#000000'
    const fontFamily = profile?.font_family || 'Inter'

    const paymentStatus = (data.payment_status as string) === 'draft' ? 'UNPAID' : data.payment_status === 'partially_paid' ? 'Partially Paid' : (data.payment_status || 'UNPAID')

    const priceLabel = items.every(item => item.price_type === 'mrp') ? 'MRP' : 'Rate'
    const showUPIQR = settings.show_upi_qr !== false && bankDetails?.upi_id && data.payment_status !== 'paid'
    const upiURL = bankDetails?.upi_id ? `upi://pay?pa=${bankDetails.upi_id}&pn=${encodeURIComponent(profile?.company_name || '')}&am=${data.balance_amount !== undefined ? data.balance_amount : data.total_amount}&cu=INR` : ''

    return (
        <div
            className="bg-white w-[210mm] mx-auto p-6 text-[9px] text-black font-sans leading-relaxed"
            style={{ fontFamily }}
        >

            {/* HEADER */}
            <div className="flex justify-between items-start border-b pb-4 mb-6">

                {/* LEFT */}
                <div>
                    {profile?.logo_url && (
                        <div className="relative h-12 w-44 mb-2">
                            <img
                                src={profile.logo_url}
                                alt={`${profile.company_name} logo`}
                                className="w-full h-full object-contain object-left"
                            />
                        </div>
                    )}

                    <h1
                        className="font-bold text-[13px] uppercase tracking-wide"
                        style={{ color: brandColor }}
                    >
                        {profile?.company_name}
                    </h1>
                    <p>{profile?.address}</p>
                    <p>
                        GSTIN: {profile?.gstin} | Ph: {profile?.phone}
                    </p>
                    <p>{profile?.email}</p>
                </div>

                {/* RIGHT */}
                <div className="text-right space-y-2">

                    <h2 className="text-[15px] font-bold uppercase tracking-wide">
                        {isInvoice ? 'INVOICE' : 'QUOTATION'}
                    </h2>

                    <p className="font-semibold text-[10px]">
                        {isInvoice ? data.invoice_number : data.quotation_number}
                    </p>

                    <p>
                        {new Date(
                            (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
                        ).toLocaleDateString('en-IN')}
                    </p>

                    {/* PAYMENT STATUS TAG */}
                    {isInvoice && (
                        <div className={`inline-block px-3 py-0.5 border rounded-none text-[9px] font-bold `}>
                            {paymentStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* BILL & SHIP */}
            <div className="grid grid-cols-2 gap-4 mb-4">

                <div>
                    <p className="font-bold text-[10px] mb-0.5">Bill To:</p>
                    <p className="font-semibold text-[10px]">
                        {data.customers?.name}
                    </p>
                    <p className="whitespace-pre-line text-slate-600 leading-relaxed">{data.billing_address || data.customers?.billing_address}</p>
                    <div className="mt-2 space-y-1 text-slate-500 font-medium">
                        <p>Phone: {data.billing_phone || data.customers?.billing_phone || data.customers?.phone || 'N/A'}</p>
                        <p>GSTIN: {data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin || 'N/A'}</p>
                    </div>
                </div>

                {(data.shipping_address || data.customers?.shipping_address) && (
                    <div className="text-right">
                        <p className="font-bold text-[10px] mb-0.5">Ship To:</p>
                        <p className="font-semibold text-[10px]">
                            {data.customers?.name}
                        </p>
                        <p className="whitespace-pre-line text-slate-600 leading-relaxed">{data.shipping_address || data.customers?.shipping_address}</p>
                        <div className="mt-2 space-y-1 text-slate-500 font-medium">
                            <p>Phone: {data.shipping_phone || data.customers?.shipping_phone || data.customers?.phone || 'N/A'}</p>
                            <p>GSTIN: {data.shipping_gstin || data.customers?.shipping_gstin || data.customers?.gstin || 'N/A'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ITEMS TABLE */}
            <table className="w-full border border-gray-400 text-[9px] mb-4 table-fixed">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border px-1 py-1 text-left w-8">#</th>
                        <th className="border px-1 py-1 text-center w-16">Image</th>
                        <th className="border px-2 py-1 text-left w-auto">Description</th>
                        <th className="border px-1 py-1 text-center w-20">HSN</th>
                        <th className="border px-1 py-1 text-center w-20">{priceLabel}</th>
                        <th className="border px-1 py-1 text-center w-10">Qty</th>
                        <th className="border px-1 py-1 text-right w-24">Amount   <span className="block text-[8px] font-normal text-gray-400">{priceLabel} × Qty</span></th>
                        {hasAnyDiscount && <th className="border px-1 py-1 text-center w-20">Discount (%)</th>}
                        <th className="border px-1 py-1 text-right w-20">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="break-inside-avoid">
                            <td className="border px-1 py-1 text-center w-8">{index + 1}</td>
                            <td className="border px-1 py-1 text-center w-16">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name || ''} className="w-8 h-8 object-contain mx-auto" />
                                ) : (
                                    <span className="text-[8px] text-gray-400">No img</span>
                                )}
                            </td>
                            <td className="border px-2 py-1 w-auto break-words">
                                <p className="font-bold break-words">{item.item_name || item.name}</p>
                                {item.description && (
                                    <p className="text-[8px] text-gray-500 whitespace-pre-wrap break-words">{item.description}</p>
                                )}
                            </td>
                            <td className="border px-1 py-1 text-center w-20 break-words">{item.hsn_code || '-'}</td>
                            <td className="border px-1 py-1 text-center w-20">
                                ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border px-1 py-1 text-center w-10">{item.quantity}</td>
                            <td className="border px-1 py-1 text-center w-24">
                                ₹{((item.unit_price || item.rate || 0) * (item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
{hasAnyDiscount && (
    <td className="border px-1 py-1 text-center w-20">
        {(() => {
            if (item.discount_type === 'percent') {
                return `${(item.discount_rate ?? item.discount ?? 0)}%`;
            }
            const lineAmount = (item.unit_price || item.rate || 0) * (item.quantity || 0);
            const discAmt = item.discount || 0;
            if (lineAmount > 0 && discAmt > 0) {
                return `${((discAmt / lineAmount) * 100).toFixed(2)}%`;
            }
            return `${discAmt}%`;
        })()}
    </td>
)}
                        
                            <td className="border px-1 py-1 text-right font-medium w-20">
                                ₹{(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-2 gap-6 mt-4">

                {/* LEFT: Bank Details, Terms, and Tax Breakdown */}
                <div className="space-y-4">

                    
                    {/* Tax Summary on Left as requested */}
                    {!allGstIsZero && (
                        <div className="bg-gray-50 p-3 rounded-none border border-gray-100 break-inside-avoid">
                            <p className="font-bold text-[10px] mb-2 border-b pb-1">Tax Analysis Sum:</p>
                            <table className="w-full text-[8px] border-collapse">
                                <thead>
                                    <tr className="text-gray-500 border-b">
                                        <th className="text-left py-1">Type</th>
                                        <th className="text-center py-1">Rate</th>
                                        <th className="text-right py-1">Taxable</th>
                                        <th className="text-right py-1">Tax Amt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Group by tax rate for summary */}
                                    {Object.values(items.reduce((acc, item) => {
                                        const rate = item.tax_rate ?? 18;
                                        const taxable = (item.total - (item.tax_amount || 0));
                                        const tax = item.tax_amount || 0;
                                        const key = `${rate}`;
                                        if (!acc[key]) acc[key] = { rate, taxable: 0, tax: 0 };
                                        acc[key].taxable += taxable;
                                        acc[key].tax += tax;
                                        return acc;
                                    }, {} as Record<string, any>)).map((t: any, i: number) => (
                                        <React.Fragment key={i}>
                                            <tr className="border-b border-gray-200">
                                                <td className="py-1">GST ({t.rate}%)</td>
                                                <td className="text-center py-1">{t.rate}%</td>
                                                <td className="text-right py-1">₹{t.taxable.toLocaleString('en-IN')}</td>
                                                <td className="text-right py-1 font-bold">₹{t.tax.toLocaleString('en-IN')}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    <tr className="font-black">
                                        <td colSpan={3} className="pt-2 text-right">Total Tax:</td>
                                        <td className="pt-2 text-right">₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}


                    {settings.show_bank_details && bankDetails && (
                        <div className="bg-gray-50 p-3 rounded-none border border-gray-100 break-inside-avoid">
                            <p className="font-bold text-[10px] mb-2 border-b pb-1">Bank Account Info:</p>
                            <div className="grid grid-cols-2 gap-y-0.5 text-[9px]">
                                <span className="text-gray-500 font-medium">Account No:</span> <span className="font-bold">{bankDetails.account_number}</span>
                                <span className="text-gray-500 font-medium">IFSC Code:</span> <span className="font-bold">{bankDetails.ifsc_code}</span>
                                <span className="text-gray-500 font-medium">Bank Name:</span> <span>{bankDetails.bank_branch_name}</span>
                                <span className="text-gray-500 font-medium">Account Holder:</span> <span>{bankDetails.account_holder_name}</span>
                                <span className="text-gray-500 font-medium">UPI ID:</span> <span className="text-primary font-bold">{bankDetails.upi_id}</span>
                            </div>
                        </div>
                    )}

                   
                </div>

                {/* RIGHT TOTALS: Simplified and clear */}
                <div className="space-y-2 pt-2 pr-2">
                    <h1 className="text-base font-bold text-slate-900">Summary </h1>
                    <div className="flex justify-between text-gray-600">
                        <span className="font-bold">Subtotal (Net Value)</span>
                        <span className="font-black text-slate-900">₹{(data.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {!allGstIsZero && (
                        <div className="flex justify-between text-gray-600">
                            <span className="font-bold">Estimated Tax (GST)</span>
                            <span className="font-black text-slate-900">₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    {(data.transport_charges || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span className="font-bold">Transport Charges</span>
                            <span className="font-black text-slate-900">₹{(data.transport_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {(data.installation_charges || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span className="font-bold">Installation Costs</span>
                            <span className="font-black text-slate-900">₹{(data.installation_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {data.discount > 0 && (
                        <div className="flex justify-between text-green-700 bg-green-50 px-2 py-0.5 rounded-none">
                            <span className="font-bold uppercase text-[9px]">Addl. Cash Discount{data.general_discount_type === 'percent' ? ` (${data.discount}%)` : ''}</span>
                            <span className="font-black">{data.general_discount_type === 'percent'
                            ? `-${data.discount}%`
                            : `-₹${(data.discount || 0).toLocaleString('en-IN')}`}</span>
                        </div>
                    )}

                    {Array.isArray(data.custom_charges) && data.custom_charges.map((charge: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-gray-600">
                            <span className="font-bold">{charge.name || 'Misc Charge'}</span>
                            <span className="font-black text-slate-900">₹{Number(charge.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    ))}

                    <div className="flex justify-between items-end border-t-2 border-slate-900 pt-3 mt-2 break-inside-avoid">
                        <div>
                            <span className="text-[8px] font-bold uppercase text-slate-500">Payable Amount</span>
                            <div className="text-sm font-bold text-slate-900">Grand Total</div>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                            ₹{(data.total_amount || 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                            })}
                        </span>
                    </div>

                    {settings.show_signature && (
                        <div className="mt-20 text-right">
                            <p className="text-[8px] text-gray-400 uppercase font-black mb-6">Authorized Signature</p>
                            {profile?.signature_url && (
                                <div className="relative h-8 w-36 ml-auto mb-1">
                                    <img
                                        src={profile.signature_url}
                                        alt="Signature"
                                        className="w-full h-full object-contain object-right"
                                    />
                                </div>
                            )}
                            <div className="border-t border-slate-900 w-64 ml-auto pt-1">
                                <p className="font-black text-slate-900 uppercase text-[9px] italic tracking-widest whitespace-nowrap">{profile?.company_name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
 {settings.show_terms && (
                        <div>
                            <p className="font-bold text-[10px] mb-1 uppercase tracking-tighter italic">Terms and Condition:</p>
                            <div className="text-[9px] leading-relaxed text-gray-600">
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
            {/* PROMO FOOTER */}
            <div className="mt-8 text-center border-t border-gray-100 pt-4">
                <p className="text-[8px] text-gray-400 font-medium">
                    {BILLMENSOR_PROMO}
                </p>
            </div>

        </div>
    )
}
