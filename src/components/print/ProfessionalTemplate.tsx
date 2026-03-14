'use client'

import Image from 'next/image'
import { MdEdit } from 'react-icons/md'
import { PrintTemplateProps } from '@/types/print'
import { BILLMENSOR_PROMO } from '@/lib/marketing'
import QRCode from 'react-qr-code'

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
    const hasAnyDiscount = items.some(item => (item.discount || 0) > 0)

    const brandColor = profile?.brand_color || '#000000'
    const fontFamily = profile?.font_family || 'Inter'

    const paymentStatus = data.payment_status || 'UNPAID'

    const showUPIQR = settings.show_upi_qr !== false && bankDetails?.upi_id && data.payment_status !== 'paid'
    const upiURL = bankDetails?.upi_id ? `upi://pay?pa=${bankDetails.upi_id}&pn=${encodeURIComponent(profile?.company_name || '')}&am=${data.balance_amount !== undefined ? data.balance_amount : data.total_amount}&cu=INR` : ''

    return (
        <div
            className="bg-white w-[210mm] mx-auto p-8 text-[13px] text-black font-sans leading-relaxed"
            style={{ fontFamily }}
        >

            {/* HEADER */}
            <div className="flex justify-between items-start border-b pb-4 mb-6">

                {/* LEFT */}
                <div>
                    {profile?.logo_url && (
                        <div className="relative h-12 w-44 mb-2">
                            <Image
                                src={profile.logo_url}
                                alt={`${profile.company_name} logo`}
                                fill
                                priority
                                className="object-contain object-left"
                            />
                        </div>
                    )}

                    <h1
                        className="font-bold text-[18px] uppercase tracking-wide"
                        style={{ color: brandColor }}
                    >
                        {profile?.company_name}
                    </h1>
                    <p className="text-[13px]">{profile?.address}</p>
                    <p className="text-[13px]">
                        GSTIN: {profile?.gstin} | Ph: {profile?.phone}
                    </p>
                    <p className="text-[13px]">{profile?.email}</p>
                </div>

                {/* RIGHT */}
                <div className="text-right space-y-2">

                    <h2 className="text-[20px] font-bold uppercase tracking-wide">
                        {isInvoice ? 'INVOICE' : 'QUOTATION'}
                    </h2>

                    <p className="font-semibold text-[14px]">
                        {isInvoice ? data.invoice_number : data.quotation_number}
                    </p>

                    <p className="text-[13px]">
                        {new Date(
                            (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
                        ).toLocaleDateString('en-IN')}
                    </p>

                    {/* PAYMENT STATUS TAG */}
                    {isInvoice && (
                        <div className={`inline-block px-4 py-1 border rounded-full text-[12px] font-bold `}>
                            {paymentStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* BILL & SHIP */}
            <div className="grid grid-cols-2 gap-6 mb-6">

                <div>
                    <p className="font-bold text-[14px] mb-1">Bill To:</p>
                    <p className="font-semibold text-[14px]">
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
                        <p className="font-bold text-[14px] mb-1">Ship To:</p>
                        <p className="font-semibold text-[14px]">
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
            <table className="w-full border border-gray-400 text-[13px] mb-6">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border px-3 py-2 text-left">#</th>
                        <th className="border px-3 py-2 text-center">Image</th>
                        <th className="border px-3 py-2 text-left">Description</th>
                        <th className="border px-3 py-2 text-center">HSN</th>
                        <th className="border px-3 py-2 text-center">Qty</th>
                        <th className="border px-3 py-2 text-center">Rate</th>
                        {hasAnyDiscount && <th className="border px-3 py-2 text-center">Disc</th>}
                        {!allGstIsZero && <th className="border px-3 py-2 text-center">GST%</th>}
                        <th className="border px-3 py-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="border px-3 py-2 text-center">{index + 1}</td>
                            <td className="border px-2 py-2 text-center">
                                {item.image_url ? (
                                    <Image src={item.image_url} alt={item.name || ''} width={40} height={40} className="object-contain mx-auto" />
                                ) : (
                                    <span className="text-[10px] text-gray-400">No img</span>
                                )}
                            </td>
                            <td className="border px-3 py-2">{item.item_name || item.name}</td>
                            <td className="border px-3 py-2 text-center">{item.hsn_code || '-'}</td>
                            <td className="border px-3 py-2 text-center">{item.quantity}</td>
                            <td className="border px-3 py-2 text-center">
                                ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                            </td>
                            {hasAnyDiscount && (
                                <td className="border px-3 py-2 text-center">
                                    ₹{(item.discount || 0).toLocaleString('en-IN')}
                                </td>
                            )}
                            {!allGstIsZero && (
                                <td className="border px-3 py-2 text-center">
                                    {item.tax_rate ?? 18}%
                                </td>
                            )}
                            <td className="border px-3 py-2 text-right font-medium">
                                ₹{(item.total || ((item.quantity || 0) * (item.unit_price || item.rate || 0)) - (item.discount || 0)).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-2 gap-8 mt-6">

                {/* LEFT */}
                <div className="space-y-4">

                    {settings.show_bank_details && bankDetails && (
                        <div>
                            <p className="font-bold text-[14px] mb-2">Bank Details:</p>
                            <p>A/C: {bankDetails.account_number}</p>
                            <p>IFSC: {bankDetails.ifsc_code}</p>
                            <p>{bankDetails.bank_branch_name}</p>
                            <p>Holder: {bankDetails.account_holder_name}</p>
                            <p>UPI ID: {bankDetails.upi_id}</p>
                        </div>
                    )}

                    {settings.show_terms && (
                        <div>
                            <p className="font-bold text-[14px] mb-2">Terms & Conditions:</p>
                            <div className="text-[12px] leading-relaxed">
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


                </div>

                {/* RIGHT TOTALS */}
                <div className="space-y-2 text-[14px]">

                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{(data.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {!allGstIsZero && (
                        <div className="flex justify-between">
                            <span>GST</span>
                            <span>₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {(data.transport_charges || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Transport</span>
                            <span>₹{(data.transport_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {(data.installation_charges || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Installation</span>
                            <span>₹{(data.installation_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {(() => {
                        const itemDiscountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0)
                        if (itemDiscountTotal <= 0) return null
                        return (
                            <div className="flex justify-between text-red-600 font-bold">
                                <span>Item Discount Total</span>
                                <span>-₹{itemDiscountTotal.toLocaleString('en-IN')}</span>
                            </div>
                        )
                    })()}

                    {data.discount > 0 && (
                        <div className="flex justify-between text-red-600 font-bold">
                            <span>Additional Discount {data.discount > 0 && data.discount < 100 && data.discount % 1 !== 0 ? `(${data.discount}%)` : ''}</span>
                            <span>-₹{(data.discount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {Array.isArray(data.custom_charges) && data.custom_charges.map((charge: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                            <span>{charge.name || 'Custom'}</span>
                            <span>₹{Number(charge.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    ))}

                    {/* {(data.round_off || 0) !== 0 && (
                        <div className="flex justify-between">
                            <span>Round Off</span>
                            <span>
                                {(data.round_off || 0) > 0 ? '+' : ''}₹{(data.round_off || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    )} */}

                    <div className="flex justify-between font-bold border-t pt-3 text-[16px]">
                        <span>Total</span>
                        <span>
                            ₹{(data.total_amount || 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                            })}
                        </span>
                    </div>

                    {settings.show_signature && (
                        <div className="mt-10 text-right">
                            <p className="mb-8">For {profile?.company_name}</p>
                            <div className="h-12 flex justify-end items-end">
                                <MdEdit size={22} />
                            </div>
                            <p className="border-t w-48 ml-auto text-center pt-1">
                                Authorized Signatory
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* PROMO FOOTER */}
            <div className="mt-12 text-center border-t border-gray-100 pt-8">
                <p className="text-[10px] text-gray-400 font-medium">
                    {BILLMENSOR_PROMO}
                </p>
            </div>

        </div>
    )
}
