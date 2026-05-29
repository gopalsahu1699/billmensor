import React from 'react'
import { PrintTemplateProps } from '@/types/print'
import { BILLMENSOR_PROMO } from '@/lib/marketing'

function amountToWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    if (amount === 0) return 'Zero Rupees Only'

    const convertHundreds = (num: number): string => {
        let result = ''
        if (num >= 100) {
            result += ones[Math.floor(num / 100)] + ' Hundred '
            num %= 100
        }
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' '
            num %= 10
        }
        if (num > 0) {
            result += ones[num] + ' '
        }
        return result
    }

    const intPart = Math.floor(amount)
    const decPart = Math.round((amount - intPart) * 100)

    let result = ''
    if (intPart >= 10000000) {
        result += convertHundreds(Math.floor(intPart / 10000000)) + 'Crore '
    }
    if (intPart >= 100000) {
        result += convertHundreds(Math.floor((intPart % 10000000) / 100000)) + 'Lakh '
    }
    if (intPart >= 1000) {
        result += convertHundreds(Math.floor((intPart % 100000) / 1000)) + 'Thousand '
    }
    if (intPart >= 100) {
        result += convertHundreds(Math.floor(intPart % 1000)) + ''
    }
    if (intPart % 100 > 0) {
        result += convertHundreds(intPart % 100)
    }

    result = result.trim() + ' Rupees'
    if (decPart > 0) {
        result += ' and ' + convertHundreds(decPart).trim() + ' Paise'
    }
    result += ' Only'
    return result
}

export function ClassicTemplate({
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

    const companyName = profile?.company_name || 'Company Name'

    return (
        <div
            className="bg-white w-[210mm] mx-auto p-6 text-[12px] text-black leading-relaxed"
            style={{ fontFamily: 'Georgia, serif' }}
        >
            {/* HEADER BOX */}
            <div style={{ border: '3px double #000', padding: '12px', marginBottom: '12px' }}>
                <div className="text-center">
                    {profile?.logo_url ? (
                        <div className="mb-2">
                            <img
                                src={profile.logo_url}
                                alt={`${companyName} logo`}
                                className="h-16 mx-auto object-contain"
                            />
                        </div>
                    ) : null}
                    <h1 className="text-[22px] font-bold uppercase tracking-widest mb-1">
                        {companyName}
                    </h1>
                    <div style={{ borderBottom: '2px solid #000', width: '100px', margin: '4px auto' }}></div>
                    <p className="text-[11px]">{profile?.address}</p>
                    <p className="text-[11px]">
                        {profile?.state && `State: ${profile.state}`}
                        {profile?.gstin && ` | GSTIN: ${profile.gstin}`}
                        {profile?.phone && ` | Ph: ${profile.phone}`}
                    </p>
                    {profile?.email && <p className="text-[11px]">{profile.email}</p>}
                </div>
            </div>

            {/* INVOICE DETAILS + DATE BOX */}
            <div className="flex justify-between mb-4">
                <div style={{ border: '2px solid #000', padding: '10px', flex: 1, marginRight: '12px' }}>
                    <p className="font-bold text-[13px] mb-2 uppercase border-b border-black pb-1">
                        {isInvoice ? 'Bill To' : 'Quotation For'}
                    </p>
                    <p className="font-bold text-[12px]">{data.customers?.name || 'N/A'}</p>
                    <p className="whitespace-pre-line text-[11px]">{data.billing_address || data.customers?.billing_address || 'N/A'}</p>
                    <p className="text-[11px]">Ph: {data.billing_phone || data.customers?.billing_phone || data.customers?.phone || 'N/A'}</p>
                    <p className="text-[11px]">GSTIN: {data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin || 'N/A'}</p>
                </div>
                <div style={{ border: '2px solid #000', padding: '10px', width: '220px' }}>
                    <table className="w-full text-[11px]">
                        <tbody>
                            <tr>
                                <td className="font-bold py-1 pr-3">{isInvoice ? 'Invoice No:' : 'Estimate No:'}</td>
                                <td className="py-1">{isInvoice ? data.invoice_number : data.quotation_number}</td>
                            </tr>
                            <tr>
                                <td className="font-bold py-1 pr-3">Date:</td>
                                <td className="py-1">
                                    {new Date(
                                        (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
                                    ).toLocaleDateString('en-IN')}
                                </td>
                            </tr>
                            {isInvoice && (
                                <tr>
                                    <td className="font-bold py-1 pr-3">Status:</td>
                                    <td className="py-1 font-bold uppercase">{data.payment_status || 'UNPAID'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SHIP TO (if different) */}
            {(data.shipping_address || data.customers?.shipping_address) && (
                <div style={{ border: '2px solid #000', padding: '10px', marginBottom: '12px' }}>
                    <p className="font-bold text-[13px] mb-1 uppercase border-b border-black pb-1">Ship To</p>
                    <p className="text-[11px]">{data.customers?.name}</p>
                    <p className="whitespace-pre-line text-[11px]">{data.shipping_address || data.customers?.shipping_address}</p>
                    <p className="text-[11px]">Ph: {data.shipping_phone || data.customers?.shipping_phone || 'N/A'}</p>
                    <p className="text-[11px]">GSTIN: {data.shipping_gstin || data.customers?.shipping_gstin || 'N/A'}</p>
                </div>
            )}

            {/* ITEMS TABLE */}
            <div style={{ border: '3px solid #000', marginBottom: '12px' }}>
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e5e5e5', borderBottom: '2px solid #000' }}>
                            <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '30px' }}>#</th>
                            <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'left' }}>Description</th>
                            <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '70px' }}>HSN/SAC</th>
                            <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '45px' }}>Qty</th>
                            <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'right', width: '70px' }}>Rate</th>
                            {hasAnyDiscount && (
                                <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '50px' }}>Disc%</th>
                            )}
                            {!allGstIsZero && (
                                <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', width: '50px' }}>GST%</th>
                            )}
                            <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'right', width: '85px' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={index}
                                className="break-inside-avoid"
                                style={{
                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                    borderBottom: '1px solid #000'
                                }}
                            >
                                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 4px' }}>
                                    <p className="font-bold">{item.item_name || item.name}</p>
                                    {item.description && (
                                        <p className="text-[10px] text-gray-600 whitespace-pre-wrap">{item.description}</p>
                                    )}
                                </td>
                                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{item.hsn_code || '-'}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'right' }}>
                                    ₹{(item.unit_price || item.rate || 0).toLocaleString('en-IN')}
                                </td>
                                {hasAnyDiscount && (
                                    <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>
                                        {item.discount || 0}%
                                    </td>
                                )}
                                {!allGstIsZero && (
                                    <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>
                                        {item.tax_rate ?? 18}%
                                    </td>
                                )}
                                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                                    ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* FOOTER: BANK + TERMS (LEFT) | TOTALS (RIGHT) */}
            <div className="flex gap-4 mb-4">
                {/* LEFT: Bank & Terms */}
                <div className="flex-1 space-y-3">
                    {settings.show_bank_details && bankDetails && (
                        <div style={{ border: '2px solid #000', padding: '8px' }}>
                            <p className="font-bold text-[12px] mb-2 uppercase border-b border-black pb-1">Bank Details</p>
                            <div className="text-[10px] space-y-1">
                                <p><span className="font-bold">A/C No:</span> {bankDetails.account_number}</p>
                                <p><span className="font-bold">IFSC:</span> {bankDetails.ifsc_code}</p>
                                <p><span className="font-bold">Bank:</span> {bankDetails.bank_branch_name}</p>
                                {bankDetails.account_holder_name && <p><span className="font-bold">Holder:</span> {bankDetails.account_holder_name}</p>}
                                {bankDetails.upi_id && <p><span className="font-bold">UPI:</span> {bankDetails.upi_id}</p>}
                            </div>
                        </div>
                    )}

                    {settings.show_terms && (
                        <div style={{ border: '2px solid #000', padding: '8px' }}>
                            <p className="font-bold text-[12px] mb-2 uppercase border-b border-black pb-1">Terms & Conditions</p>
                            <div className="text-[10px]">
                                {profile?.terms_and_conditions ? (
                                    <ol className="list-decimal pl-4 space-y-1">
                                        {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
                                            <li key={i}>{term.trim()}</li>
                                        ))}
                                    </ol>
                                ) : (
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Goods once sold will not be taken back or exchanged.</li>
                                        <li>Subject to local jurisdiction.</li>
                                        <li>Payment due within 30 days of invoice date.</li>
                                    </ol>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: TOTALS */}
                <div style={{ width: '250px' }}>
                    <div style={{ border: '2px solid #000', padding: '8px' }}>
                        <table className="w-full text-[11px]">
                            <tbody>
                                <tr>
                                    <td className="py-1 font-bold">Subtotal</td>
                                    <td className="py-1 text-right">₹{(data.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                {data.discount > 0 && (
                                    <tr>
                                        <td className="py-1 font-bold">Discount</td>
                                        <td className="py-1 text-right">-₹{(data.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                                {!allGstIsZero && (
                                    <tr>
                                        <td className="py-1 font-bold">Tax (GST)</td>
                                        <td className="py-1 text-right">₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                                {(data.transport_charges || 0) > 0 && (
                                    <tr>
                                        <td className="py-1 font-bold">Transport</td>
                                        <td className="py-1 text-right">₹{(data.transport_charges || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                {(data.installation_charges || 0) > 0 && (
                                    <tr>
                                        <td className="py-1 font-bold">Installation</td>
                                        <td className="py-1 text-right">₹{(data.installation_charges || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                {(data.round_off || 0) !== 0 && (
                                    <tr>
                                        <td className="py-1 font-bold">Round Off</td>
                                        <td className="py-1 text-right">{(data.round_off || 0) > 0 ? '+' : ''}₹{(data.round_off || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* GRAND TOTAL - DOUBLE BORDER BOX */}
                    <div style={{ border: '4px double #000', padding: '10px', marginTop: '6px', backgroundColor: '#f5f5f5' }}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-[14px] uppercase">Grand Total</span>
                            <span className="font-bold text-[16px]">
                                ₹{(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Amount in Words */}
                    <div className="mt-3 text-[10px] border border-black p-2">
                        <span className="font-bold">Amount in Words: </span>
                        {amountToWords(data.total_amount || 0)}
                    </div>
                </div>
            </div>

            {/* SIGNATURE */}
            {settings.show_signature && (
                <div className="flex justify-between items-end mt-6">
                    <div></div>
                    <div className="text-right">
                        {profile?.signature_url && (
                            <div className="mb-2">
                                <img
                                    src={profile.signature_url}
                                    alt="Signature"
                                    className="h-12 ml-auto object-contain"
                                />
                            </div>
                        )}
                        <div style={{ borderTop: '1px solid #000', width: '180px', marginLeft: 'auto', paddingTop: '4px' }}>
                            <p className="text-[11px] font-bold">For {companyName}</p>
                        </div>
                        <p className="text-[10px] mt-1">Authorized Signatory</p>
                    </div>
                </div>
            )}

            {/* PROMO FOOTER */}
            <div className="mt-8 text-center border-t border-gray-300 pt-4">
                <p className="text-[9px] text-gray-500">{BILLMENSOR_PROMO}</p>
            </div>
        </div>
    )
}
