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

export function GSTInvoiceTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type
}: PrintTemplateProps) {

    const isInvoice = type === 'invoice'
    const allGstIsZero = items.every(item => (item.tax_rate ?? 18) === 0)

    const companyName = profile?.company_name || 'Company Name'
    const companyAddress = profile?.address || ''
    const companyState = profile?.state || ''
    const companyGstin = profile?.gstin || ''

    const docNumber = isInvoice ? data.invoice_number : data.quotation_number
    const docDate = new Date(
        (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
    ).toLocaleDateString('en-IN')

    // Compute per-item tax details
    const computeItemTax = (item: typeof items[0]) => {
        const rate = item.tax_rate ?? 18
        const taxable = item.total - (item.tax_amount || 0)
        const gst = item.tax_amount || 0
        const cgstRate = rate / 2
        const sgstRate = rate / 2
        const cgstAmt = gst / 2
        const sgstAmt = gst / 2
        const igstRate = 0
        const igstAmt = 0
        const discount = item.discount || 0
        return { rate, taxable, cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, discount }
    }

    // Aggregate tax summary
    const taxSummary = items.reduce((acc, item) => {
        const { cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, taxable } = computeItemTax(item)
        const key = `${item.tax_rate ?? 18}`
        if (!acc[key]) acc[key] = { rate: item.tax_rate ?? 18, taxable: 0, cgstRate, cgstAmt: 0, sgstRate, sgstAmt: 0, igstRate, igstAmt: 0 }
        acc[key].taxable += taxable
        acc[key].cgstAmt += cgstAmt
        acc[key].sgstAmt += sgstAmt
        acc[key].igstAmt += igstAmt
        return acc
    }, {} as Record<string, { rate: number; taxable: number; cgstRate: number; cgstAmt: number; sgstRate: number; sgstAmt: 0; igstRate: number; igstAmt: 0 }>)

    const totalCgst = Object.values(taxSummary).reduce((s, t) => s + t.cgstAmt, 0)
    const totalSgst = Object.values(taxSummary).reduce((s, t) => s + t.sgstAmt, 0)
    const totalIgst = Object.values(taxSummary).reduce((s, t) => s + t.igstAmt, 0)
    const totalTaxable = Object.values(taxSummary).reduce((s, t) => s + t.taxable, 0)

    return (
        <div
            className="bg-white w-[210mm] mx-auto p-6 text-[11px] text-black leading-relaxed"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
            {/* HEADER: TAX INVOICE */}
            <div className="text-center mb-4">
                <div className="border-b-2 border-t-2 border-black py-2">
                    <h1 className="text-[18px] font-bold uppercase tracking-[4px]">
                        {isInvoice ? 'TAX INVOICE' : 'QUOTATION / ESTIMATE'}
                    </h1>
                </div>
            </div>

            {/* SUPPLIER + INVOICE DETAILS */}
            <div className="flex gap-4 mb-4">
                {/* SUPPLIER SECTION */}
                <div style={{ border: '1px solid #000', padding: '8px', flex: 1 }}>
                    <p className="font-bold text-[12px] border-b border-black pb-1 mb-2 uppercase">Supplier Details</p>
                    <div className="space-y-1 text-[11px]">
                        <p className="font-bold">{companyName}</p>
                        <p>{companyAddress}</p>
                        <div className="flex gap-8">
                            <p>GSTIN: <span className="font-bold">{companyGstin || 'N/A'}</span></p>
                            <p>State: <span className="font-bold">{companyState || 'N/A'}</span></p>
                        </div>
                        {profile?.phone && <p>Ph: {profile.phone}</p>}
                    </div>
                </div>

                {/* INVOICE DETAILS */}
                <div style={{ border: '1px solid #000', padding: '8px', width: '220px' }}>
                    <p className="font-bold text-[12px] border-b border-black pb-1 mb-2 uppercase">Invoice Details</p>
                    <table className="w-full text-[11px]">
                        <tbody>
                            <tr>
                                <td className="py-1 font-bold pr-2">Invoice No:</td>
                                <td className="py-1">{docNumber}</td>
                            </tr>
                            <tr>
                                <td className="py-1 font-bold pr-2">Date:</td>
                                <td className="py-1">{docDate}</td>
                            </tr>
                            <tr>
                                <td className="py-1 font-bold pr-2">Type:</td>
                                <td className="py-1">{isInvoice ? 'Tax Invoice' : 'Estimate'}</td>
                            </tr>
                            {isInvoice && (
                                <tr>
                                    <td className="py-1 font-bold pr-2">Payment:</td>
                                    <td className="py-1 font-bold uppercase">{data.payment_status || 'UNPAID'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BUYER + CONSIGNEE */}
            <div className="flex gap-4 mb-4">
                {/* BUYER (Bill To) */}
                <div style={{ border: '1px solid #000', padding: '8px', flex: 1 }}>
                    <p className="font-bold text-[12px] border-b border-black pb-1 mb-2 uppercase">Buyer (Bill To)</p>
                    <div className="space-y-1 text-[11px]">
                        <p className="font-bold">{data.customers?.name || 'N/A'}</p>
                        <p className="whitespace-pre-line">{data.billing_address || data.customers?.billing_address || 'N/A'}</p>
                        <p>GSTIN: {data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin || 'N/A'}</p>
                        <p>Ph: {data.billing_phone || data.customers?.billing_phone || data.customers?.phone || 'N/A'}</p>
                    </div>
                </div>

                {/* CONSIGNEE (Ship To) */}
                <div style={{ border: '1px solid #000', padding: '8px', flex: 1 }}>
                    <p className="font-bold text-[12px] border-b border-black pb-1 mb-2 uppercase">Consignee (Ship To)</p>
                    <div className="space-y-1 text-[11px]">
                        <p className="font-bold">{data.customers?.name || 'N/A'}</p>
                        <p className="whitespace-pre-line">{data.shipping_address || data.customers?.shipping_address || data.billing_address || data.customers?.billing_address || 'N/A'}</p>
                        <p>GSTIN: {data.shipping_gstin || data.customers?.shipping_gstin || data.customers?.gstin || 'N/A'}</p>
                        <p>Ph: {data.shipping_phone || data.customers?.shipping_phone || data.customers?.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* PLACE OF SUPPLY + REVERSE CHARGE */}
            <div className="flex gap-4 mb-4">
                <div style={{ border: '1px solid #000', padding: '8px', flex: 1 }}>
                    <p className="text-[11px]">
                        <span className="font-bold">Place of Supply: </span>
                        {data.supply_place || data.customers?.supply_place || companyState || 'N/A'}
                    </p>
                </div>
                <div style={{ border: '1px solid #000', padding: '8px', width: '200px' }}>
                    <p className="text-[11px]">
                        <span className="font-bold">Reverse Charge: </span>
                        No
                    </p>
                </div>
            </div>

            {/* ITEMS TABLE - GST COMPLIANT COLUMNS */}
            <div style={{ border: '2px solid #000', marginBottom: '10px' }}>
                <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e5e5e5' }}>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', width: '25px' }}>SL</th>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'left' }}>Description</th>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', width: '55px' }}>HSN/SAC</th>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', width: '35px' }}>Qty</th>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '55px' }}>Rate</th>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '45px' }}>Disc</th>
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '65px' }}>Taxable Value</th>
                            {!allGstIsZero && (
                                <>
                                    <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', width: '35px' }}>CGST Rate</th>
                                    <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '55px' }}>CGST Amt</th>
                                    <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', width: '35px' }}>SGST Rate</th>
                                    <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '55px' }}>SGST Amt</th>
                                    <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', width: '35px' }}>IGST Rate</th>
                                    <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '55px' }}>IGST Amt</th>
                                </>
                            )}
                            <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'right', width: '65px' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const tax = computeItemTax(item)
                            return (
                                <tr key={index} className="break-inside-avoid" style={{ borderBottom: '1px solid #000' }}>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px' }}>
                                        <p className="font-bold">{item.item_name || item.name}</p>
                                        {item.description && (
                                            <p className="text-[9px] text-gray-600 whitespace-pre-wrap">{item.description}</p>
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center' }}>{item.hsn_code || '-'}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right' }}>
                                        ₹{(item.unit_price || item.rate || 0).toFixed(2)}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right' }}>
                                        {tax.discount > 0 ? `₹${tax.discount.toFixed(2)}` : '-'}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right', fontWeight: 'bold' }}>
                                        ₹{tax.taxable.toFixed(2)}
                                    </td>
                                    {!allGstIsZero && (
                                        <>
                                            <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center' }}>{tax.cgstRate}%</td>
                                            <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right' }}>₹{tax.cgstAmt.toFixed(2)}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center' }}>{tax.sgstRate}%</td>
                                            <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right' }}>₹{tax.sgstAmt.toFixed(2)}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center' }}>{tax.igstRate}%</td>
                                            <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right' }}>₹{tax.igstAmt.toFixed(2)}</td>
                                        </>
                                    )}
                                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'right', fontWeight: 'bold' }}>
                                        ₹{item.total.toFixed(2)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* TAX SUMMARY + TOTALS */}
            <div className="flex gap-4 mb-4">
                {/* Tax Summary Table */}
                {!allGstIsZero && (
                    <div style={{ border: '1px solid #000', padding: '8px', flex: 1 }}>
                        <p className="font-bold text-[11px] mb-2 uppercase border-b border-black pb-1">Tax Summary</p>
                        <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e5e5e5' }}>
                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Tax Rate</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Taxable Amt</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>CGST</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>SGST</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>IGST</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Total Tax</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(taxSummary).map((t, i) => (
                                    <tr key={i}>
                                        <td style={{ border: '1px solid #000', padding: '4px' }}>{t.rate}%</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{t.taxable.toFixed(2)}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{t.cgstAmt.toFixed(2)}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{t.sgstAmt.toFixed(2)}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{t.igstAmt.toFixed(2)}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>₹{(t.cgstAmt + t.sgstAmt + t.igstAmt).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#e5e5e5' }}>
                                    <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>TOTAL</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>₹{totalTaxable.toFixed(2)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>₹{totalCgst.toFixed(2)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>₹{totalSgst.toFixed(2)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>₹{totalIgst.toFixed(2)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>₹{(totalCgst + totalSgst + totalIgst).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TOTALS */}
                <div style={{ width: '250px' }}>
                    <div style={{ border: '1px solid #000', padding: '8px' }}>
                        <table className="w-full text-[11px]">
                            <tbody>
                                <tr>
                                    <td className="py-1 font-bold">Taxable Amount</td>
                                    <td className="py-1 text-right">₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                {!allGstIsZero && (
                                    <>
                                        <tr>
                                            <td className="py-1 font-bold">CGST</td>
                                            <td className="py-1 text-right">₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 font-bold">SGST</td>
                                            <td className="py-1 text-right">₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        {totalIgst > 0 && (
                                            <tr>
                                                <td className="py-1 font-bold">IGST</td>
                                                <td className="py-1 text-right">₹{totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="py-1 font-bold">Total Tax</td>
                                            <td className="py-1 text-right font-bold">₹{(data.tax_total || data.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </>
                                )}
                                {data.discount > 0 && (
                                    <tr>
                                        <td className="py-1 font-bold">Discount</td>
                                        <td className="py-1 text-right">-₹{(data.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                                        <td className="py-1 text-right">{(data.round_off || 0) > 0 ? '+' : ''}₹{(data.round_off || 0).toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* GRAND TOTAL */}
                    <div style={{ border: '3px double #000', padding: '8px', marginTop: '6px', backgroundColor: '#f5f5f5' }}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-[13px] uppercase">Grand Total</span>
                            <span className="font-bold text-[15px]">
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

            {/* DECLARATION */}
            <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '10px' }}>
                <p className="font-bold text-[11px] mb-1 uppercase">Declaration</p>
                <p className="text-[10px]">
                    Certified that the particulars given above are true and correct to the best of my knowledge and belief.
                </p>
            </div>

            {/* BANK DETAILS + AUTHORIZED SIGNATORY */}
            <div className="flex gap-4 mb-4">
                {settings.show_bank_details && bankDetails && (
                    <div style={{ border: '1px solid #000', padding: '8px', flex: 1 }}>
                        <p className="font-bold text-[11px] mb-2 uppercase border-b border-black pb-1">Bank Details</p>
                        <div className="text-[10px] space-y-1">
                            <p><span className="font-bold">A/C No:</span> {bankDetails.account_number}</p>
                            <p><span className="font-bold">IFSC:</span> {bankDetails.ifsc_code}</p>
                            <p><span className="font-bold">Bank:</span> {bankDetails.bank_branch_name}</p>
                            {bankDetails.account_holder_name && <p><span className="font-bold">Holder:</span> {bankDetails.account_holder_name}</p>}
                            {bankDetails.upi_id && <p><span className="font-bold">UPI:</span> {bankDetails.upi_id}</p>}
                        </div>
                    </div>
                )}

                {/* AUTHORIZED SIGNATORY */}
                {settings.show_signature && (
                    <div style={{ border: '1px solid #000', padding: '8px', width: '250px' }}>
                        <p className="font-bold text-[11px] mb-4 uppercase border-b border-black pb-1">Authorized Signatory</p>
                        <div className="text-center">
                            {profile?.signature_url && (
                                <div className="mb-2">
                                    <img
                                        src={profile.signature_url}
                                        alt="Signature"
                                        className="h-12 mx-auto object-contain"
                                    />
                                </div>
                            )}
                            <div style={{ borderTop: '1px solid #000', width: '160px', margin: '0 auto', paddingTop: '4px' }}>
                                <p className="text-[11px] font-bold">{companyName}</p>
                                <p className="text-[9px] text-gray-500">Date: {docDate}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PROMO FOOTER */}
            <div className="mt-6 text-center border-t border-gray-200 pt-4">
                <p className="text-[9px] text-gray-400">{BILLMENSOR_PROMO}</p>
            </div>
        </div>
    )
}
