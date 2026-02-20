'use client'

import React from 'react'

interface CompactTemplateProps {
    data: any;
    profile: any;
    items: any[];
    settings: any;
    type: 'invoice' | 'quotation';
}

export function CompactTemplate({ data, profile, items, settings, type }: CompactTemplateProps) {
    const isInvoice = type === 'invoice';

    return (
        <div className="bg-white p-6 text-slate-800 font-sans text-[10px] leading-tight">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <div>
                    <h1 className="text-lg font-black uppercase">{profile?.company_name}</h1>
                    <p className="opacity-70">{profile?.address}</p>
                    <p>GSTIN: {profile?.gstin} | Ph: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black uppercase opacity-20">{isInvoice ? 'Invoice' : 'Estimate'}</h2>
                    <p className="font-bold">{isInvoice ? data.invoice_number : data.quotation_number}</p>
                    <p>{new Date(isInvoice ? data.invoice_date : data.quotation_date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                    <p className="font-black uppercase text-[8px] text-slate-400 mb-1">Bill To:</p>
                    <p className="font-bold">{data.customers?.name}</p>
                    <p className="opacity-70">{data.customers?.billing_address}</p>
                </div>
                {settings.show_custom_fields && (
                    <div className="text-right">
                        <p className="font-black uppercase text-[8px] text-slate-400 mb-1">Reference:</p>
                        {profile?.custom_field_1_label && <p>{profile.custom_field_1_label}: {profile.custom_field_1_value}</p>}
                    </div>
                )}
            </div>

            {/* Items */}
            <table className="w-full mb-6 border-collapse">
                <thead>
                    <tr className="bg-slate-100 font-bold uppercase text-[8px]">
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-center">Rate</th>
                        <th className="p-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="p-2 font-bold">{item.name}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-center">₹{item.unit_price}</td>
                            <td className="p-2 text-right font-bold">₹{item.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            <div className="flex justify-between items-start">
                <div className="w-1/2 space-y-4">
                    {settings.show_bank_details && (
                        <div className="text-[8px] opacity-70">
                            <p className="font-bold">BANK DETAILS:</p>
                            <p>Acc: 123456789 | IFSC: SBIN0001234</p>
                        </div>
                    )}
                    {settings.show_terms && (
                        <p className="text-[8px] opacity-50 italic">Terms: {profile?.terms_and_conditions || 'Goods once sold will not be taken back.'}</p>
                    )}
                </div>
                <div className="w-1/3 text-right space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{data.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900 pt-1 font-black text-xs">
                        <span>Total:</span>
                        <span>₹{data.total_amount.toLocaleString()}</span>
                    </div>
                    {settings.show_signature && (
                        <div className="mt-8 pt-4 border-t border-dashed border-slate-200">
                            <p className="font-black uppercase text-[8px]">Authorized Signatory</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
