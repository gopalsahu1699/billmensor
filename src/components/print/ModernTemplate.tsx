'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { PrintTemplateProps } from '@/types/print'
import { BILLMENSOR_PROMO } from '@/lib/marketing'
import QRCode from 'react-qr-code'

export function ModernTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type,
}: PrintTemplateProps) {
    const brandColor = profile?.brand_color || '#2563eb'
    const accentColor = profile?.accent_color || '#1e293b'
    const fontFamily = profile?.font_family || 'Inter'
    const allGstIsZero = items.every(item => (item.tax_rate ?? 18) === 0)
    const hasAnyDiscount = items.some(item => (item.discount || 0) > 0)

    const showUPIQR = settings.show_upi_qr !== false && bankDetails?.upi_id && data.payment_status !== 'paid'
    const upiURL = bankDetails?.upi_id ? `upi://pay?pa=${bankDetails.upi_id}&pn=${encodeURIComponent(profile?.company_name || '')}&am=${data.balance_amount !== undefined ? data.balance_amount : data.total_amount}&cu=INR` : ''

    return (
        <Card
            className="rounded-4xl border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none print:p-0"
            style={{ fontFamily }}
        >
            <div className="p-6 lg:p-8 space-y-6 print:p-0 text-[12px] leading-snug text-slate-900 bg-white">

                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-3">
                        {profile?.logo_url ? (
                            <div className="relative w-30 h-8">
                                <Image
                                    src={profile.logo_url}
                                    alt="Logo"
                                    fill
                                    priority
                                    className="object-contain object-left"
                                />
                            </div>
                        ) : (
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                                style={{ backgroundColor: brandColor }}
                            >
                                <span className="material-symbols-outlined text-[20px]">analytics</span>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">
                                {type === 'invoice' ? 'Tax Invoice' : 'Quotation'}
                            </p>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {data.invoice_number || data.quotation_number}
                            </h2>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase
              ${data.payment_status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'}`}>
                            <span className={`w-2 h-2 rounded-full
                ${data.payment_status === 'paid'
                                    ? 'bg-green-500'
                                    : 'bg-orange-500'}`}></span>
                            {data.payment_status}
                        </div>

                        <div className="mt-3 text-sm font-medium text-slate-800">
                            <p className="text-[11px] text-slate-600">Issue Date</p>
                            <p>
                                {new Date(data.invoice_date || data.quotation_date || new Date()).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* VENDOR + CLIENT */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-200">

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-2">
                            Vendor Info
                        </p>
                        <p className="font-bold text-lg text-slate-900">
                            {profile?.company_name || 'Billmensor'}
                        </p>
                        <p className="text-[12px] text-slate-700 mt-1">
                            {profile?.address}
                        </p>

                        <div className="mt-2 space-y-1 text-[11px]">
                            <p><span className="font-semibold">GST:</span> {profile?.gstin}</p>
                            <p><span className="font-semibold">Mob:</span> {profile?.phone}</p>
                        </div>
                    </div>

                    <div className="flex-1 text-right border-l border-slate-200 pl-6 space-y-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                Bill To Client
                            </p>
                            <p className="font-bold text-lg text-slate-900 leading-tight">
                                {data.customers?.name}
                            </p>
                            <p className="text-[12px] text-slate-700 mt-1 whitespace-pre-line">
                                {data.billing_address || data.customers?.billing_address}
                            </p>
                            <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                                <p><span className="font-semibold text-slate-900">Phone:</span> {data.billing_phone || data.customers?.billing_phone || data.customers?.phone || 'N/A'}</p>
                                <p className="flex justify-between"><span>GSTIN:</span> <span className="text-slate-900 font-medium">{data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin || 'N/A'}</span></p>
                                <p><span className="font-semibold text-slate-900">POS:</span> {data.supply_place || data.customers?.supply_place || 'N/A'}</p>
                            </div>
                        </div>

                        {(data.shipping_address || data.customers?.shipping_address) && (
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Ship To
                                </p>
                                <p className="text-[12px] text-slate-700 whitespace-pre-line">
                                    {data.shipping_address || data.customers?.shipping_address}
                                </p>
                                <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                                    <p><span className="font-semibold text-slate-900">Phone:</span> {data.shipping_phone || data.customers?.shipping_phone || data.customers?.phone || 'N/A'}</p>
                                    <p className="flex justify-between"><span>GSTIN:</span> <span className="text-slate-900 font-medium">{data.shipping_gstin || data.customers?.shipping_gstin || data.customers?.gstin || 'N/A'}</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr
                                className="border-b border-slate-300 text-[11px] font-semibold uppercase"
                                style={{ color: accentColor }}
                            >
                                <th className="px-2 pb-2 text-left w-8">#</th>
                                <th className="px-2 pb-2 text-center w-12">Image</th>
                                <th className="px-2 pb-2 text-left">Description</th>
                                <th className="px-2 pb-2 text-center">Qty</th>
                                <th className="px-2 pb-2 text-center">Rate</th>
                                {hasAnyDiscount && <th className="px-2 pb-2 text-center">Disc</th>}
                                {!allGstIsZero && <th className="px-2 pb-2 text-center">GST%</th>}
                                <th className="px-2 pb-2 text-right">Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="px-2 py-2 font-semibold text-slate-600">{index + 1}</td>
                                    <td className="px-2 py-2 text-center">
                                        {item.image_url ? (
                                            <Image src={item.image_url} alt={item.name || ''} width={40} height={40} className="object-contain mx-auto" />
                                        ) : (
                                            <span className="text-[10px] text-slate-400">No img</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2">
                                        <p className="font-semibold text-slate-900 text-[12px]">{item.name || item.item_name}</p>
                                        {item.description && (
                                            <p className="text-[10px] text-slate-500 whitespace-pre-wrap mb-1">{item.description}</p>
                                        )}
                                        <p className="text-[10px] text-slate-600">HSN: {item.hsn_code || '-'}</p>
                                    </td>
                                    <td className="px-2 py-2 text-center">{item.quantity}</td>
                                    <td className="px-2 py-2 text-center">
                                        ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                                    </td>
                                    {hasAnyDiscount && (
                                        <td className="px-2 py-2 text-center text-slate-600">
                                            ₹{(item.discount || 0).toLocaleString('en-IN')}
                                        </td>
                                    )}
                                    {!allGstIsZero && (
                                        <td className="px-2 py-2 text-center text-slate-600 text-[11px]">
                                            {item.tax_rate ?? 18}%
                                        </td>
                                    )}
                                    <td className="px-2 py-2 text-right font-semibold">
                                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER: Balanced Grid Layout */}
                <div className="flex flex-row justify-between pt-8 border-t border-slate-200 mt-8 gap-12">

                    {/* LEFT SECTION: Taxes, Banks, Terms */}
                    <div className="flex-1 space-y-6">

                        {!allGstIsZero && (
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-b border-slate-100 pb-2">Tax analysis summary</p>
                                <table className="w-full text-[11px] border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-100 italic">
                                            <th className="text-left py-2 font-black uppercase">Tax Category</th>
                                            <th className="text-right py-2 font-black uppercase">Net Taxable</th>
                                            <th className="text-right py-2 font-black uppercase text-blue-600">GST Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
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
                                            <tr key={i} className="border-b border-slate-50 last:border-0">
                                                <td className="py-3 text-slate-700 font-bold uppercase tracking-tighter italic">GST {t.rate}%</td>
                                                <td className="text-right py-3 text-slate-500 italic">₹{t.taxable.toLocaleString('en-IN')}</td>
                                                <td className="text-right py-3 font-black text-slate-900 border-l border-slate-50 pl-4 italic">₹{t.tax.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {settings.show_bank_details && bankDetails && (
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4 italic">
                                    Bank Account Settlement
                                </p>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px] italic">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter not-italic">Account No</span>
                                        <span className="font-black text-slate-900">{bankDetails.account_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter not-italic">IFSC Code</span>
                                        <span className="font-bold text-slate-900">{bankDetails.ifsc_code}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter not-italic">Bank Name</span>
                                        <span className="text-slate-600">{bankDetails.bank_branch_name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter not-italic">Account Holder</span>
                                        <span className="text-slate-600">{bankDetails.account_holder_name}</span>
                                    </div>
                                    <div className="col-span-2 mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] not-italic">Instant UPI ID</span>
                                        <span className="text-primary font-black text-sm">{bankDetails.upi_id}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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
                    </div>

                    {/* RIGHT SECTION: Totals */}
                    <div className="w-[320px] pt-4 pr-4 space-y-3">
                        <div className="flex justify-between text-[12px]">
                            <span>Subtotal</span>
                            <span className="font-semibold">
                                ₹{(data.subtotal || 0).toLocaleString('en-IN')}
                            </span>
                        </div>

                        {!allGstIsZero && (
                            <div className="flex justify-between text-[12px]">
                                <span>Tax</span>
                                <span className="font-semibold">
                                    ₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        {data.transport_charges > 0 && (
                            <div className="flex justify-between text-[12px]">
                                <span>Transport</span>
                                <span className="font-semibold">
                                    ₹{data.transport_charges.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        {data.installation_charges > 0 && (
                            <div className="flex justify-between text-[12px]">
                                <span>Installation</span>
                                <span className="font-semibold">
                                    ₹{data.installation_charges.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        {data.discount > 0 && (
                            <div className="flex justify-between text-[12px] text-red-600 font-bold">
                                <span>Addl. Discount</span>
                                <span className="font-semibold">
                                    -₹{data.discount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        {Array.isArray(data.custom_charges) && data.custom_charges.map((charge: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[12px]">
                                <span>{charge.name || 'Custom'}</span>
                                <span className="font-semibold">
                                    ₹{Number(charge.amount || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))}
                        {/* 
                        {(data.round_off || 0) !== 0 && (
                            <div className="flex justify-between text-[12px]">
                                <span>Round Off</span>
                                <span className="font-semibold">
                                    {(data.round_off || 0) > 0 ? '+' : ''}₹{(data.round_off || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )} */}

                        <div className="flex justify-between items-end pt-3 border-t border-slate-900">
                            <span className="text-[13px] font-bold uppercase">
                                Total
                            </span>
                            <span className="text-2xl font-bold text-slate-900">
                                ₹{(data.total_amount || 0).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2
                                })}
                            </span>
                        </div>

                        {settings.show_signature && (
                            <div className="pt-6 border-t border-dashed border-slate-300 mt-4 flex flex-col items-end">
                                {profile?.signature_url && (
                                    <div className="relative h-12 w-32 mb-2">
                                        <Image
                                            src={profile.signature_url}
                                            alt="Signature"
                                            fill
                                            priority
                                            className="object-contain object-right"
                                        />
                                    </div>
                                )}
                                <p className="text-[11px] font-semibold uppercase">
                                    Authorized Signature
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                {/* PROMO FOOTER */}
                <div className="pt-8 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                        {BILLMENSOR_PROMO}
                    </p>
                </div>
            </div>
        </Card>
    )
}