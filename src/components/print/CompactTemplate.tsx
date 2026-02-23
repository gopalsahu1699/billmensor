'use client'

import Image from 'next/image'
import { PrintTemplateProps } from '@/types/print'

export function CompactTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type
}: PrintTemplateProps) {

    const isInvoice = type === 'invoice'

    return (
        <div
            id="invoice"
            className="bg-white text-black font-sans text-[14px] leading-tight mx-auto"
            style={{
                width: '794px',
                padding: '24px',
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

                    <h1 className="text-lg font-bold mt-2">
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

            {/* BILLING */}
            <div className="flex justify-between border-b border-black pb-3 mb-3">
                <div>
                    <h3 className="font-bold">Billed To:</h3>
                    <p>{data.customers?.name}</p>
                    <p>{data.customers?.billing_address}</p>
                    <p>GST: {data.customers?.gstin || 'N/A'}</p>
                </div>

                {(data.customers?.shipping_address) && (
                    <div className="text-right">
                        <h3 className="font-bold">Shipped To:</h3>
                        <p>{data.customers?.shipping_address}</p>
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
                            <td className="py-2 text-right">
                                ₹{(item.total || 0).toLocaleString('en-IN')}
                            </td>
                        </tr>

                    ))}
                </tbody>
            </table>

            {/* TOTALS */}
            <div className="flex justify-end mb-4">
                <div style={{ width: 250 }}>
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{(data.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>GST:</span>
                        <span>₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {data.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Discount:</span>
                            <span>-₹{data.discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-black pt-2">
                        <span>Total:</span>
                        <span>₹{(data.total_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* BANK + TERMS + SIGN */}
            <div className="flex justify-between">

                <div style={{ width: '60%' }}>
                    {settings.show_bank_details && bankDetails && (
                        <>
                            <h4 className="font-bold">Bank Details:</h4>
                            <p>Account: {bankDetails.account_number}</p>
                            <p>IFSC: {bankDetails.ifsc_code}</p>
                            <p>Bank: {bankDetails.bank_branch_name}</p>
                            <p>Holder: {bankDetails.account_holder_name}</p>
                        </>
                    )}

                    {settings.show_terms && (
                        <>
                            <h4 className="font-bold mt-3">Terms & Conditions:</h4>
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
                        </>
                    )}
                </div>

                {settings.show_signature && (
                    <div className="text-right">
                        <p className="mb-10">Authorized Signatory</p>
                        {profile?.signature_url && (
                            <div style={{ width: 120, height: 50, position: 'relative' }}>
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
    )
}