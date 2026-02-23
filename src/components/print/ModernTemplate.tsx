'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { PrintTemplateProps } from '@/types/print'

export function ModernTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
}: PrintTemplateProps) {
    return (
        <Card className="rounded-[40px] border-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none print:p-0">
            <div className="p-6 lg:p-8 space-y-6 print:p-0 text-[12px] leading-snug text-slate-900 bg-white">

                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-3">
                        {profile?.logo_url ? (
                            <div className="relative w-[120px] h-8">
                                <Image
                                    src={profile.logo_url}
                                    alt="Logo"
                                    fill
                                    priority
                                    className="object-contain object-left"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-[20px]">analytics</span>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">
                                Tax Invoice
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
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-[24px] border border-slate-200">

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

                    <div className="text-right border-l border-slate-200 pl-6">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-2">
                            Bill To Client
                        </p>
                        <p className="font-bold text-lg text-slate-900">
                            {data.customers?.name}
                        </p>
                        <p className="text-[12px] text-slate-700 mt-1">
                            {data.billing_address || data.customers?.billing_address}
                        </p>

                        <div className="mt-2 text-[11px] space-y-1">
                            <p><span className="font-semibold">GST:</span> {data.customers?.gstin || 'Not Registered'}</p>
                            <p><span className="font-semibold">POS:</span> {data.supply_place || data.customers?.supply_place || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-300 text-[11px] font-semibold text-slate-700 uppercase">
                                <th className="px-2 pb-2 text-left w-8">#</th>
                                <th className="px-2 pb-2 text-center w-12">Image</th>
                                <th className="px-2 pb-2 text-left">Description</th>
                                <th className="px-2 pb-2 text-center">Qty</th>
                                <th className="px-2 pb-2 text-center">Rate</th>
                                <th className="px-2 pb-2 text-right">Total</th>
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
                                        <p className="text-[10px] text-slate-600">HSN: {item.hsn_code || '-'}</p>
                                    </td>
                                    <td className="px-2 py-2 text-center">{item.quantity}</td>
                                    <td className="px-2 py-2 text-center">
                                        ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-2 py-2 text-right font-semibold">
                                        ₹{(item.total || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-start pt-6 border-t border-slate-300">

                    {/* BANK + TERMS */}
                    <div className="max-w-[230px] space-y-4">

                        {settings.show_bank_details && bankDetails && (
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 mb-2">
                                    Bank Details
                                </p>
                                <div className="text-[11px] space-y-1">
                                    <p><span className="font-semibold">A/C No:</span> {bankDetails.account_number}</p>
                                    <p><span className="font-semibold">IFSC:</span> {bankDetails.ifsc_code}</p>
                                    <p><span className="font-semibold">Bank:</span> {bankDetails.bank_branch_name}</p>
                                </div>
                            </div>
                        )}

                        {settings.show_terms && (
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 mb-1">
                                    Terms & Conditions
                                </p>
                                <div className="text-[11px] text-slate-700">
                                    {profile?.terms_and_conditions ? (
                                        <ul className="list-disc pl-3 space-y-0.5">
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
                    </div>

                    {/* TOTAL */}
                    <div className="w-64 text-right space-y-2">
                        <div className="flex justify-between text-[12px]">
                            <span>Subtotal</span>
                            <span className="font-semibold">
                                ₹{(data.subtotal || 0).toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div className="flex justify-between text-[12px]">
                            <span>Tax</span>
                            <span className="font-semibold">
                                ₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}
                            </span>
                        </div>

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
            </div>
        </Card>
    )
}