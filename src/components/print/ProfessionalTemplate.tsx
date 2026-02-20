'use client'

import React from 'react'
import { QrCode, Landmark, Truck, Wrench, PenTool } from 'lucide-react'

interface ProfessionalTemplateProps {
    data: any; // Invoice or Quotation data
    profile: any; // Business profile
    bankDetails?: any; // Company bank details
    items: any[];
    settings: any; // Print visibility settings
    type: 'invoice' | 'quotation';
}

export function ProfessionalTemplate({ data, profile, bankDetails, items, settings, type }: ProfessionalTemplateProps) {
    const isInvoice = type === 'invoice';
    const primaryColor = isInvoice ? 'text-blue-700' : 'text-slate-800';
    const borderColor = isInvoice ? 'border-blue-100' : 'border-slate-200';

    return (
        <div className="bg-white p-12 text-slate-950 font-sans leading-relaxed">
            {/* Professional Header */}
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

            {/* Bill To & Ship To Grid */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className={`bg-slate-50 p-6 rounded-2xl border ${borderColor}`}>
                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-4">Bill To:</p>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">
                            {data.parties?.name || data.customers?.name || 'Client Name'}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                            {data.parties?.billing_address || data.customers?.billing_address || 'Address not provided'}
                        </p>
                        <div className="pt-3 text-xs space-y-1">
                            {(data.parties?.phone || data.customers?.phone) && <p><span className="font-bold">Phone:</span> {data.parties?.phone || data.customers?.phone}</p>}
                            {(data.parties?.gstin || data.customers?.gstin) && <p className="font-black text-blue-600 uppercase tracking-widest">GST: {data.parties?.gstin || data.customers?.gstin}</p>}
                        </div>
                    </div>
                </div>

                {(data.parties?.shipping_address || data.customers?.shipping_address) && (
                    <div className={`bg-slate-50 p-6 rounded-2xl border ${borderColor} border-dashed`}>
                        <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-4 text-right">Ship To:</p>
                        <div className="space-y-1 text-right">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                {data.parties?.name || data.customers?.name}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed ml-auto max-w-xs italic">
                                {data.parties?.shipping_address || data.customers?.shipping_address}
                            </p>
                        </div>
                    </div>
                )}

                {!isInvoice && data.expiry_date && (
                    <div className="mt-4">
                        <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Valid Until</h3>
                        <p className="font-black text-red-600">{new Date(data.expiry_date).toLocaleDateString()}</p>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div className="mb-12">
                <table className="w-full text-left">
                    <thead>
                        <tr className={`${isInvoice ? 'bg-blue-600' : 'bg-slate-800'} text-white uppercase text-[10px] font-black tracking-widest`}>
                            <th className="py-4 px-6 rounded-l-xl">Description</th>
                            <th className="py-4 text-center">HSN/SAC</th>
                            <th className="py-4 text-center">Qty</th>
                            <th className="py-4 text-center">Rate</th>
                            <th className="py-4 text-center">GST %</th>
                            <th className="py-4 px-6 text-right rounded-r-xl">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                <td className="py-6 px-6">
                                    <p className="font-black text-slate-900">{item.item_name || item.name}</p>
                                    <p className="text-[10px] text-slate-700 mt-1 uppercase">SKU: {item.product_id?.slice(0, 8) || 'N/A'}</p>
                                </td>
                                <td className="py-6 text-center text-sm font-bold text-slate-500">{item.hsn_code || '-'}</td>
                                <td className="py-6 text-center text-sm font-black">{item.quantity}</td>
                                <td className="py-6 text-center text-sm font-bold">₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}</td>
                                <td className="py-6 text-center text-sm font-bold text-slate-500">{item.tax_rate || 18}%</td>
                                <td className="py-6 px-6 text-right font-black text-slate-900 italic">₹{(item.total || 0).toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Calculations & Summary */}
            <div className="grid grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    {settings.show_bank_details && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Landmark size={14} className="text-slate-700" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Bank Transfer Details</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                                <div>
                                    <p className="text-slate-700 mb-0.5">Account Number</p>
                                    <p className="font-black">{bankDetails?.account_number || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-700 mb-0.5">IFSC Code</p>
                                    <p className="font-black uppercase">{bankDetails?.ifsc_code || 'Not set'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-700 mb-0.5">Bank &amp; Branch Name</p>
                                    <p className="font-black">{bankDetails?.bank_branch_name || 'Not set'}</p>
                                </div>
                                {bankDetails?.account_holder_name && (
                                    <div className="col-span-2">
                                        <p className="text-slate-700 mb-0.5">Account Holder</p>
                                        <p className="font-black">{bankDetails.account_holder_name}</p>
                                    </div>
                                )}
                                {settings.show_upi_qr && bankDetails?.upi_id && (
                                    <div className="col-span-2">
                                        <p className="text-slate-700 mb-0.5">UPI ID</p>
                                        <p className="font-black text-blue-600">{bankDetails.upi_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {settings.show_terms && (
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-2">Terms & Conditions</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                                {profile?.terms_and_conditions || '1. Goods once sold will not be taken back. 2. Please make the payment within 15 days.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500 border-b border-slate-50 pb-2">
                        <span>Subtotal</span>
                        <span className="text-slate-900">₹{(data.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500 border-b border-slate-50 pb-2">
                        <span>Tax Total (GST)</span>
                        <span className="text-slate-900">₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {data.transport_charges > 0 && (
                        <div className="flex justify-between items-center text-sm font-bold text-slate-500 border-b border-slate-50 pb-2 italic">
                            <span className="flex items-center gap-2"><Truck size={12} /> Transport</span>
                            <span className="text-slate-900">₹{(data.transport_charges).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {data.installation_charges > 0 && (
                        <div className="flex justify-between items-center text-sm font-bold text-slate-500 border-b border-slate-50 pb-2 italic">
                            <span className="flex items-center gap-2"><Wrench size={12} /> Installation</span>
                            <span className="text-slate-900">₹{(data.installation_charges).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {data.custom_charges && Array.isArray(data.custom_charges) && data.custom_charges.map((charge: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-500 border-b border-slate-50 pb-2 italic">
                            <span className="flex items-center gap-2"><PenTool size={12} /> {charge.name || 'Custom Charge'}</span>
                            <span className="text-slate-900">₹{(charge.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    ))}

                    {data.discount > 0 && (
                        <div className="flex justify-between items-center text-sm font-bold text-red-500 border-b border-slate-50 pb-2 italic">
                            <span>Extra Discount</span>
                            <span>-₹{(data.discount).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    <div className={`flex justify-between items-end pt-6`}>
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700">Total Amount Due</p>
                            <h4 className="text-sm font-black text-slate-500 italic">Rupees {data.total_amount_in_words || 'To be calculated'}</h4>
                        </div>
                        <div className="text-right">
                            <p className={`text-4xl font-black italic tracking-tighter ${primaryColor}`}>₹{(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {settings.show_signature && (
                        <div className={`mt-8 pt-6 border-t border-dashed ${borderColor} flex flex-col items-end text-right`}>
                            <div className="mb-2">
                                {profile?.signature_url ? (
                                    <img src={profile.signature_url} alt="Signature" className="h-16 w-auto grayscale" />
                                ) : (
                                    <div className="h-16 w-32 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                        <PenTool size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized Signatory</p>
                                <p className="text-[8px] font-bold text-slate-700 uppercase">For {profile?.company_name}</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}

