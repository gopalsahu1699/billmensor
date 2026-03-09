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
                            <td className="py-2 text-left">{item.item_name || item.name}</td>
                            <td className="py-2 text-center">{item.hsn_code || '-'}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-center">
                                ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                            </td>
                            {!allGstIsZero && (
                                <td className="py-2 text-center text-[10px]">
                                    {item.tax_rate ?? 18}%
                                </td>
                            )}
                            <td className="py-2 text-right">
                                ₹{((item.quantity || 0) * (item.unit_price || item.rate || 0)).toLocaleString('en-IN')}
                            </td>
                        </tr>

                    ))}
                </tbody>
            </table>

            {/* BOTTOM SECTION: Bank Details (Left) + Totals (Right) */}
            <div className="flex justify-between gap-6 mt-2">

                {/* LEFT: Bank Details + Terms */}
                <div style={{ width: '55%' }} className="space-y-3">
                    {settings.show_bank_details && bankDetails && (
                        <div>
                            <h4 className="font-bold text-[13px] mb-1 border-b border-black pb-1">Bank Details</h4>
                            <p>Account: {bankDetails.account_number}</p>
                            <p>IFSC: {bankDetails.ifsc_code}</p>
                            <p>Bank: {bankDetails.bank_branch_name}</p>
                            <p>Holder: {bankDetails.account_holder_name}</p>
                            {bankDetails.upi_id && <p>UPI ID: {bankDetails.upi_id}</p>}
                        </div>
                    )}

                    {settings.show_terms && (
                        <div>
                            <h4 className="font-bold text-[13px] mb-1 border-b border-black pb-1">Terms & Conditions</h4>
                            <div className="text-[12px]">
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

                {/* RIGHT: Charges + Totals + Signature */}
                <div style={{ width: '40%' }} className="space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{(data.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {!allGstIsZero && (
                        <div className="flex justify-between">
                            <span>GST:</span>
                            <span>₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(data.transport_charges || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Transport:</span>
                            <span>₹{(data.transport_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(data.installation_charges || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Installation:</span>
                            <span>₹{(data.installation_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(() => {
                        const itemDiscountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0)
                        if (itemDiscountTotal <= 0) return null
                        return (
                            <div className="flex justify-between text-red-600 font-bold">
                                <span>Item Discount:</span>
                                <span>-₹{itemDiscountTotal.toLocaleString('en-IN')}</span>
                            </div>
                        )
                    })()}
                    {data.discount > 0 && (
                        <div className="flex justify-between text-red-600 font-bold">
                            <span>Addl. Disc:</span>
                            <span>-₹{(data.discount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {Array.isArray(data.custom_charges) && data.custom_charges.map((charge: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                            <span>{charge.name || 'Custom'}:</span>
                            <span>₹{Number(charge.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-bold border-t border-black pt-2 text-[14px]">
                        <span>Total:</span>
                        <span>₹{(data.total_amount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {settings.show_signature && (
                        <div className="mt-8 text-right">
                            <p className="mb-10 text-[12px]">Authorized Signatory</p>
                            {profile?.signature_url && (
                                <div style={{ width: 120, height: 50, position: 'relative' }} className="ml-auto">
                                    <Image
                                        src={profile.signature_url}
                                        alt="Signature"
                                        fill
                                        priority
                                        className="object-contain object-right"
                                    />
                                </div>
                            )}
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