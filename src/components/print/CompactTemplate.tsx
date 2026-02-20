'use client'

import React from 'react'

interface CompactTemplateProps {
    data: any;
    profile: any;
    bankDetails?: any;
    items: any[];
    settings: any;
    type: 'invoice' | 'quotation';
}

export function CompactTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type
}: CompactTemplateProps) {

    const isInvoice = type === 'invoice';

    return (
        <div className="bg-white p-8 text-slate-900 font-sans text-sm leading-relaxed max-w-4xl mx-auto">

            {/* ================= HEADER ================= */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-6">
                <div className="space-y-3">
                    {profile?.logo_url && (
                        <img
                            src={profile.logo_url}
                            alt="Logo"
                            className="w-[160px] h-12 object-contain"
                        />
                    )}

                    <div>
                        <h1 className="text-xl font-bold uppercase">
                            {profile?.company_name}
                        </h1>
                        <p className="text-slate-600">{profile?.address}</p>
                        <p className="text-slate-600">
                            GSTIN: {profile?.gstin} | Ph: {profile?.phone}
                        </p>
                        <p className="text-slate-600">
                            Email: {profile?.email}
                        </p>
                    </div>
                </div>

                <div className="text-right space-y-1">
                    <h2 className="text-2xl font-bold uppercase text-slate-400">
                        {isInvoice ? 'Invoice' : 'Quotation'}
                    </h2>
                    <p className="font-semibold text-base">
                        {isInvoice ? data.invoice_number : data.quotation_number}
                    </p>
                    <p className="text-slate-600">
                        {new Date(
                            isInvoice ? data.invoice_date : data.quotation_date
                        ).toLocaleDateString('en-IN')}
                    </p>
                </div>
            </div>

            {/* ================= BILLING ================= */}
            <div className="grid grid-cols-2 gap-10 mb-6 border-b border-slate-200 pb-6">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Billed To
                    </h3>
                    <p className="font-semibold">
                        {data.customers?.name || data.parties?.name}
                    </p>
                    <p className="text-slate-600 whitespace-pre-line">
                        {data.customers?.billing_address || data.parties?.billing_address}
                    </p>
                    <p className="text-slate-600 mt-1">
                        GST: {data.customers?.gstin || data.parties?.gstin || 'N/A'}
                    </p>
                </div>

                {(data.customers?.shipping_address || data.parties?.shipping_address) && (
                    <div className="text-right">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Shipped To
                        </h3>
                        <p className="font-semibold">
                            {data.customers?.name || data.parties?.name}
                        </p>
                        <p className="text-slate-600 whitespace-pre-line">
                            {data.customers?.shipping_address || data.parties?.shipping_address}
                        </p>
                    </div>
                )}
            </div>

            {/* ================= ITEMS TABLE ================= */}
            <table className="w-full mb-8 border-collapse">
                <thead>
                    <tr className="bg-slate-100 text-xs uppercase text-slate-600">
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-center">HSN/SAC</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Rate</th>
                        <th className="p-3 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="p-3 font-medium">
                                {item.item_name || item.name}
                            </td>
                            <td className="p-3 text-center text-slate-600">
                                {item.hsn_code || '-'}
                            </td>
                            <td className="p-3 text-center">
                                {item.quantity}
                            </td>
                            <td className="p-3 text-center">
                                ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-right font-semibold">
                                ₹{(item.total || 0).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ================= FOOTER ================= */}
            <div className="flex justify-between items-start">

                {/* LEFT SIDE */}
                <div className="w-1/2 space-y-6">

                    {settings.show_bank_details && (
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                                Bank Details
                            </h4>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-slate-500">Account Number</p>
                                    <p className="font-medium">
                                        {bankDetails?.account_number || 'Not set'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">IFSC Code</p>
                                    <p className="font-medium uppercase">
                                        {bankDetails?.ifsc_code || 'Not set'}
                                    </p>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-slate-500">Bank & Branch</p>
                                    <p className="font-medium">
                                        {bankDetails?.bank_branch_name || 'Not set'}
                                    </p>
                                </div>

                                {bankDetails?.account_holder_name && (
                                    <div className="col-span-2">
                                        <p className="text-slate-500">Account Holder</p>
                                        <p className="font-medium">
                                            {bankDetails.account_holder_name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {settings.show_terms && (
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Terms & Conditions
                            </h4>
                            <p className="text-xs text-slate-600 italic">
                                {profile?.terms_and_conditions ||
                                    'Goods once sold will not be taken back.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE TOTALS */}
                <div className="w-1/3 text-right space-y-2">

                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{(data.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>GST:</span>
                        <span>
                            ₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}
                        </span>
                    </div>

                    {data.discount > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span>Discount:</span>
                            <span>-₹{data.discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    <div className="flex justify-between border-t border-slate-400 pt-3 font-bold text-base mb-6">
                        <span>Total:</span>
                        <span>
                            ₹{(data.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                    </div>

                    {settings.show_signature && (
                        <div className="mt-8 border-t border-dashed border-slate-200 pt-4 flex flex-col items-end text-right">
                            <div className="mb-2">
                                {profile?.signature_url ? (
                                    <img src={profile.signature_url} alt="Signature" className="h-12 w-auto grayscale" />
                                ) : (
                                    <div className="h-12 w-24 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                        <span className="text-[10px]">Sign Here</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-xs uppercase tracking-wider text-slate-700">Authorized Signatory</p>
                                <p className="text-slate-500 text-xs mt-0.5 font-medium">For {profile?.company_name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}