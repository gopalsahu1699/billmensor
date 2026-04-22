'use client'

import Image from 'next/image'
import { PrintTemplateProps } from '@/types/print'
import { BILLMENSOR_PROMO } from '@/lib/marketing'
import QRCode from 'react-qr-code'

export function CompactTemplate({
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

    const brandColor = profile?.brand_color || '#000000'
    const fontFamily = profile?.font_family || 'Inter'

    const showUPIQR = settings.show_upi_qr !== false && bankDetails?.upi_id && data.payment_status !== 'paid'
    const upiURL = bankDetails?.upi_id ? `upi://pay?pa=${bankDetails.upi_id}&pn=${encodeURIComponent(profile?.company_name || '')}&am=${data.balance_amount !== undefined ? data.balance_amount : data.total_amount}&cu=INR` : ''

    return (
        <div
            id="invoice"
            className="bg-white text-black font-sans text-[14px] leading-tight mx-auto"
            style={{
                width: '794px',
                padding: '24px',
                fontFamily
            }}
        >

            {/* HEADER */}
            <div className="flex justify-between border-b border-black pb-3 mb-3">

                <div>
                    {profile?.logo_url && (
                        <div style={{ width: 140, height: 40, position: 'relative' }}>
                            <Image
                                src={profile.logo_url}
                                alt="Logo"
                                fill
                                priority
                                className="object-contain object-left"
                            />
                        </div>
                    )}

                    <h1
                        className="text-lg font-bold mt-2"
                        style={{ color: brandColor }}
                    >
                        {profile?.company_name}
                    </h1>
                    <p>{profile?.address}</p>
                    <p>GSTIN: {profile?.gstin}</p>
                    <p>Phone: {profile?.phone}</p>
                    <p>Email: {profile?.email}</p>
                </div>

                <div className="text-right">
                    <h2 className="text-xl font-bold">
                        {isInvoice ? 'INVOICE' : 'QUOTATION'}
                    </h2>
                    <p>{isInvoice ? data.invoice_number : data.quotation_number}</p>
                    <p>
                        {new Date(
                            (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
                        ).toLocaleDateString('en-IN')}
                    </p>
                    {isInvoice && (
                        <div className={`mt-2 inline-block px-3 py-0.5 border rounded-full text-[11px] font-bold uppercase ${data.payment_status?.toLowerCase() === 'paid'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-orange-50 border-orange-200 text-orange-700'
                            }`}>
                            {data.payment_status || 'Unpaid'}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between border-b border-black pb-3 mb-3">
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[11px] text-gray-500 mb-1">Billed To:</h3>
                    <p className="font-semibold text-[14px]">{data.customers?.name}</p>
                    <p className="whitespace-pre-line text-xs">{data.billing_address || data.customers?.billing_address}</p>
                    <p className="text-xs mt-1">Phone: {data.billing_phone || data.customers?.billing_phone || data.customers?.phone || 'N/A'}</p>
                    <p className="text-xs">GSTIN: {data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin || 'N/A'}</p>
                </div>

                {(data.shipping_address || data.customers?.shipping_address) && (
                    <div className="flex-1 text-right border-l border-gray-100 pl-4 ml-4">
                        <h3 className="font-bold uppercase text-[11px] text-gray-500 mb-1">Shipped To:</h3>
                        <p className="font-semibold text-[14px]">{data.customers?.name}</p>
                        <p className="whitespace-pre-line text-xs">{data.shipping_address || data.customers?.shipping_address}</p>
                        <p className="text-xs mt-1">Phone: {data.shipping_phone || data.customers?.shipping_phone || data.customers?.phone || 'N/A'}</p>
                        <p className="text-xs">GSTIN: {data.shipping_gstin || data.customers?.shipping_gstin || data.customers?.gstin || 'N/A'}</p>
                    </div>
                )}
            </div>

            {/* ITEMS */}
            <table className="w-full border-collapse mb-4 text-[13px]">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-2 text-center w-8">#</th>
                        <th className="py-2 text-center w-12">Image</th>
                        <th className="py-2 text-left">Description</th>
                        <th className="py-2 text-center">HSN</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-center">Rate</th>
                        {hasAnyDiscount && <th className="py-2 text-center">Disc</th>}
                        {!allGstIsZero && <th className="py-2 text-center">GST%</th>}
                        <th className="py-2 text-right">Total</th>
                    </tr>

                </thead>

                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-300">
                            <td className="py-2 text-center w-8">{idx + 1}</td>
                            <td className="py-2 text-center w-12">
                                {item.image_url ? (
                                    <div style={{ width: 40, height: 40, position: 'relative' }} className="mx-auto">
                                        <Image
                                            src={item.image_url}
                                            alt={item.item_name || item.name || 'Product'}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mx-auto">
                                        <span className="text-[8px] text-gray-400">No img</span>
                                    </div>
                                )}
                            </td>
                            <td className="py-2 text-left">
                                <p className="font-semibold">{item.item_name || item.name}</p>
                                {item.description && (
                                    <p className="text-[11px] text-gray-500 whitespace-pre-wrap">{item.description}</p>
                                )}
                            </td>
                            <td className="py-2 text-center">{item.hsn_code || '-'}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-center">
                                ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                            </td>
                            {hasAnyDiscount && (
                                <td className="py-2 text-center">
                                    ₹{(item.discount || 0).toLocaleString('en-IN')}
                                </td>
                            )}
                            {!allGstIsZero && (
                                <td className="py-2 text-center text-[10px]">
                                    {item.tax_rate ?? 18}%
                                </td>
                            )}
                            <td className="py-2 text-right">
                                ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>

                    ))}
                </tbody>
            </table>

            {/* BOTTOM SECTION: Bank Details (Left) + Totals (Right) */}
            <div className="flex justify-between gap-6 mt-4 border-t border-black pt-4">

                {/* LEFT: Bank Details + Terms + Tax Summary */}
                <div style={{ width: '55%' }} className="space-y-4">
                      {!allGstIsZero && (
                        <div>
                            <h4 className="font-bold text-[12px] mb-1 uppercase bg-gray-50 px-2 py-0.5 border-l-2 border-black">Tax Analysis</h4>
                            <table className="w-full text-[10px] border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-1">Type</th>
                                        <th className="text-right py-1 text-gray-500 font-normal">Taxable Value</th>
                                        <th className="text-right py-1">Tax Amt</th>
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
                                        <tr key={i} className="border-b border-gray-50">
                                            <td className="py-1">GST ({t.rate}%)</td>
                                            <td className="text-right py-1 italic">₹{t.taxable.toLocaleString('en-IN')}</td>
                                            <td className="text-right py-1 font-bold">₹{t.tax.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {settings.show_bank_details && bankDetails && (
                        <div>
                            <h4 className="font-bold text-[12px] mb-1 uppercase bg-gray-50 px-2 py-0.5 border-l-2 border-black">Bank Info</h4>
                            <div className="grid grid-cols-2 text-[11px] gap-x-2 bg-gray-50/50 p-2 border border-gray-100 italic">
                                <span>A/C: {bankDetails.account_number}</span>
                                <span>IFSC: {bankDetails.ifsc_code}</span>
                                <span className="col-span-2">Bank: {bankDetails.bank_branch_name}</span>
                                <span className="col-span-2">Holder: {bankDetails.account_holder_name}</span>
                            </div>
                        </div>
                    )}

                  

                    {settings.show_terms && (
                        <div>
                            <h4 className="font-bold text-[12px] mb-1 uppercase bg-gray-50 px-2 py-0.5 border-l-2 border-black">Terms</h4>
                            <div className="text-[10px] text-gray-600 italic">
                                {profile?.terms_and_conditions ? (
                                    <ul className="list-disc pl-4 space-y-0.5">
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

                {/* RIGHT: Totals + Signature */}
                <div style={{ width: '40%' }} className="space-y-2">
                    <div className="flex justify-between text-[13px] text-gray-700">
                        <span>Subtotal (Net):</span>
                        <span className="font-bold">₹{(data.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {!allGstIsZero && (
                        <div className="flex justify-between text-[13px] text-gray-700 font-medium">
                            <span>Tax (GST):</span>
                            <span>₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {(data.transport_charges || 0) > 0 && (
                        <div className="flex justify-between text-[12px] text-gray-600">
                            <span>Transport:</span>
                            <span>₹{(data.transport_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(data.installation_charges || 0) > 0 && (
                        <div className="flex justify-between text-[12px] text-gray-600">
                            <span>Installation:</span>
                            <span>₹{(data.installation_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {data.discount > 0 && (
                        <div className="flex justify-between text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[12px]">
                            <span>Additional Disc:</span>
                            <span>-₹{(data.discount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {Array.isArray(data.custom_charges) && data.custom_charges.map((charge: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[12px] text-gray-600">
                            <span>{charge.name || 'Custom'}:</span>
                            <span>₹{Number(charge.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                    <div className="flex flex-col items-end border-t-2 border-black pt-3 mt-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Net Total Amount</span>
                        <span className="text-2xl font-black italic">₹{(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {settings.show_signature && (
                        <div className="mt-8 text-right pr-2">
                            {profile?.signature_url && (
                                <div style={{ width: 120, height: 50, position: 'relative' }} className="ml-auto mb-1">
                                    <Image
                                        src={profile.signature_url}
                                        alt="Signature"
                                        fill
                                        priority
                                        className="object-contain object-right"
                                    />
                                </div>
                            )}
                            <p className="text-[10px] font-black uppercase italic tracking-widest border-t border-black pt-1 inline-block min-w-40 text-center">Authorized Signatory</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PROMO FOOTER */}
            <div className="mt-8 text-center border-t border-gray-200 pt-6">
                <p className="text-[10px] text-gray-400 font-medium">
                    {BILLMENSOR_PROMO}
                </p>
            </div>

        </div>
    )
}