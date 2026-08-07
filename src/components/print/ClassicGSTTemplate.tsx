'use client'

import type { ReactNode } from 'react'
import { PrintTemplateProps, Item, InvoiceData, Profile } from '@/types/print'
import { amountToWords } from '@/lib/amountToWords'

interface GstProfile extends Profile {
    pan?: string
    website?: string
    state_code?: string
}

interface GstInvoiceData extends InvoiceData {
    due_date?: string
    dispatch_through?: string
    delivery_note?: string
    insurance_number?: string
    purchase_order?: string
    reference_number?: string
    vehicle_number?: string
    eway_bill?: string
    e_way_bill?: string
    transport_name?: string
    driver_name?: string
    state_code?: string
    cgst_total?: number
    sgst_total?: number
    igst_total?: number
    cess?: number
    amount_paid?: number
    balance_amount?: number
}

interface GstItem extends Item {
    batch_number?: string
    expiry_date?: string
    unit?: string
    cess?: number
}

const fmtMoney = (n: number) =>
    `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

function formatDate(value?: string): string {
    if (!value) return '—'
    const date = new Date(value)
    if (isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getBadge(status?: string) {
    const s = (status || '').toLowerCase()
    if (s === 'paid') return { label: 'PAID', className: 'bg-green-100 text-green-800 border-green-700' }
    if (s === 'partially_paid' || s === 'partial') return { label: 'PARTIALLY PAID', className: 'bg-blue-100 text-blue-800 border-blue-700' }
    if (s === 'draft') return { label: 'DRAFT', className: 'bg-gray-200 text-gray-700 border-gray-600' }
    if (s === 'cancelled' || s === 'void') return { label: 'CANCELLED', className: 'bg-red-100 text-red-800 border-red-700' }
    return { label: 'UNPAID', className: 'bg-orange-100 text-orange-800 border-orange-700' }
}

function FieldRow({ label, value }: { label: string; value?: ReactNode }) {
    return (
        <div className="flex justify-between gap-4 py-[2px] text-[9px]">
            <span className="font-semibold uppercase text-gray-500 shrink-0">{label}:</span>
            <span className="font-bold text-right">{value || '—'}</span>
        </div>
    )
}

function SectionHeading({ children }: { children: ReactNode }) {
    return (
        <p className="bg-gray-200 border border-black px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-800">
            {children}
        </p>
    )
}

function TotalRow({
    label,
    value,
    bold = false,
    borderTop = false,
}: {
    label: string
    value: string
    bold?: boolean
    borderTop?: boolean
}) {
    return (
        <tr className={`${borderTop ? 'border-t border-black' : 'border-b border-gray-200'} ${bold ? 'font-black' : 'font-semibold'}`}>
            <td className="px-2 py-[3px] text-[9px] uppercase text-gray-700">{label}</td>
            <td className={`px-2 py-[3px] text-right text-[10px] ${bold ? 'font-black' : 'font-bold'}`}>{value}</td>
        </tr>
    )
}

export function ClassicGSTTemplate({
    data,
    profile,
    bankDetails,
    items,
    settings,
    type,
}: PrintTemplateProps) {
    const gp = profile as GstProfile
    const d = data as GstInvoiceData

    const fontFamily = profile?.font_family || 'Inter'
    const allGstIsZero = items.every(item => (item.tax_rate ?? 18) === 0)
    const hasAnyDiscount = items.some(item => (item.discount || 0) > 0 || (item.discount_rate || 0) > 0)
    const hasPercentDiscount = items.some(item => item.discount_type === 'percent' && (item.discount || 0) > 0)

    const isInvoice = type === 'invoice'
    const docTitle = isInvoice ? 'TAX INVOICE' : 'QUOTATION'
    const docNumber = isInvoice ? data.invoice_number : data.quotation_number

    const badge = getBadge((data.payment_status || data.status || 'unpaid') as string)

    const itemTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0)
    const cgst = d.cgst_total ?? 0
    const sgst = d.sgst_total ?? 0
    const igst = d.igst_total ?? 0

    let effCgst = cgst
    let effSgst = sgst
    const effIgst = igst
    if (cgst === 0 && sgst === 0 && igst === 0 && itemTax > 0) {
        effCgst = Number((itemTax / 2).toFixed(2))
        effSgst = Number((itemTax / 2).toFixed(2))
    }

    const cess = d.cess ?? items.reduce((sum, item) => sum + ((item as GstItem).cess || 0), 0)
    const additional = Array.isArray(data.custom_charges)
        ? data.custom_charges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0)
        : 0
    const transport = data.transport_charges || 0
    const installation = data.installation_charges || 0
    const roundOff = data.round_off ?? 0

    const discount = data.discount || 0
    const discountAmount =
        data.general_discount_type === 'percent'
            ? (data.subtotal * discount) / 100
            : discount

    const taxableAmount = (data.subtotal || 0) - discountAmount

    const computedInvoiceTotal =
        taxableAmount +
        effCgst +
        effSgst +
        effIgst +
        cess +
        additional +
        transport +
        installation +
        roundOff

    const grandTotal = data.total_amount ?? computedInvoiceTotal
    const received = d.amount_paid ?? 0

    const taxGroups = items.reduce((acc, item) => {
        const rate = item.tax_rate ?? 18
        const taxable = (item.total || 0) - (item.tax_amount || 0)
        const tax = item.tax_amount || 0
        const key = `${rate}`
        if (!acc[key]) acc[key] = { rate, taxable: 0, tax: 0 }
        acc[key].taxable += taxable
        acc[key].tax += tax
        return acc
    }, {} as Record<string, { rate: number; taxable: number; tax: number }>)

    const taxGroupsList = Object.values(taxGroups).sort((a, b) => a.rate - b.rate)
    const totalTaxAmt = taxGroupsList.reduce((sum, g) => sum + g.tax, 0)
    const isIgstInvoice = effIgst > 0

    const warrantyItems = items.filter(item => (item.warranty || '').trim())

    const infoItems = [
        { label: isInvoice ? 'Invoice Number' : 'Quotation Number', value: docNumber },
        { label: isInvoice ? 'Invoice Date' : 'Quotation Date', value: formatDate(data.invoice_date || data.quotation_date) },
        { label: 'Due Date', value: formatDate(d.due_date) },
        { label: 'Dispatch Through', value: d.dispatch_through },
        { label: 'Delivery Note', value: d.delivery_note },
        { label: 'Insurance Number', value: d.insurance_number },
        { label: 'Purchase Order', value: d.purchase_order },
        { label: 'Reference Number', value: d.reference_number },
        { label: 'Vehicle Number', value: d.vehicle_number },
        { label: 'E-Way Bill', value: d.eway_bill ?? d.e_way_bill },
    ]

    return (
        <div
            id="classic-gst-invoice"
            className="classic-gst-root relative mx-auto w-[297mm] max-w-full min-h-[210mm] bg-white text-black"
            style={{ fontFamily }}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: 297mm 210mm; margin: 10mm; }
                    html, body { background: #fff !important; }
                    .classic-gst-root {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        overflow: visible !important;
                    }
                    .classic-gst-root * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    tr, .break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    thead { display: table-header-group; }
                }
            ` }} />

            <div className="relative space-y-4 px-[10mm] py-[10mm]">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-8 border-b-4 border-black pb-4">

                    {/* LEFT: Company */}
                    <div className="flex-1">
                        <h1 className="text-lg font-black uppercase leading-tight tracking-wide">{profile?.company_name}</h1>
                        <div className="mt-0.5 h-px w-fit bg-gray-700"></div>
                        <p className="mt-1.5 text-[9px] leading-relaxed text-gray-700">{profile?.address}</p>
                        <div className="mt-1.5 space-y-0.5">
                            <p className="text-[9px] leading-relaxed text-gray-700">
                                <span className="font-bold">Mobile:</span> {profile?.phone} <span className="mx-1.5">|</span> <span className="font-bold">Email:</span> {profile?.email}
                            </p>
                            {(profile?.gstin || gp.pan) && (
                                <p className="text-[9px] leading-relaxed text-gray-700">
                                    {profile?.gstin && (
                                        <>
                                            <span className="font-bold">GSTIN:</span> {profile?.gstin}
                                            {gp.pan && <span className="mx-1.5">|</span>}
                                        </>
                                    )}
                                    {gp.pan && (
                                        <>
                                            <span className="font-bold">PAN:</span> {gp.pan}
                                        </>
                                    )}
                                </p>
                            )}
                            {gp.website && <p className="text-[9px] leading-relaxed text-gray-700"><span className="font-bold">Website:</span> {gp.website}</p>}
                        </div>
                    </div>

                    {/* RIGHT: Doc title */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="border-2 border-black p-[2px]">
                            <div className="border border-black px-6 py-1">
                                <h2 className="text-lg font-black uppercase leading-none tracking-wide">{docTitle}</h2>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-gray-700">{docNumber}</p>
                        {isInvoice && data.payment_status !== 'hide' && (
                            <div className={`inline-block border px-3 py-0.5 text-[8px] font-black uppercase ${badge.className}`}>
                                {badge.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* DOCUMENT INFORMATION BAR */}
                <div className="border border-black bg-gray-100">
                    <p className="border-b border-black px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-700">
                        {isInvoice ? 'Invoice Information' : 'Quotation Information'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5">
                        {infoItems.map((item, index) => (
                            <div key={index} className="border-r border-b border-black px-2 py-1 last:border-r-0">
                                <p className="text-[7px] font-semibold uppercase tracking-wide text-gray-600">{item.label}</p>
                                <p className="truncate text-[9px] font-bold">{item.value || '—'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BILL TO / SHIP TO */}
                <div className="grid grid-cols-2 border border-black">
                    <div className="border-r border-black p-2">
                        <SectionHeading>Bill To</SectionHeading>
                        <p className="mt-1 text-[11px] font-black">{data.customers?.name}</p>
                        <p className="whitespace-pre-line text-[9px] leading-snug">{data.billing_address || data.customers?.billing_address}</p>
                        <div className="mt-1 space-y-[1px]">
                            {!allGstIsZero && <FieldRow label="GSTIN" value={data.billing_gstin || data.customers?.billing_gstin || data.customers?.gstin} />}
                            <FieldRow label="Phone" value={data.billing_phone || data.customers?.billing_phone || data.customers?.phone} />
                            <FieldRow label="Transport" value={d.transport_name} />
                            <FieldRow label="Driver" value={d.driver_name} />
                        </div>
                    </div>
                    <div className="p-2">
                        <SectionHeading>Ship To</SectionHeading>
                        <p className="mt-1 text-[11px] font-black">{data.customers?.name}</p>
                        <p className="whitespace-pre-line text-[9px] leading-snug">{data.shipping_address || data.customers?.shipping_address || data.billing_address || data.customers?.billing_address}</p>
                        <div className="mt-1 space-y-[1px]">
                            {!allGstIsZero && <FieldRow label="GSTIN" value={data.shipping_gstin || data.customers?.shipping_gstin || data.customers?.gstin} />}
                            <FieldRow label="Phone" value={data.shipping_phone || data.customers?.shipping_phone || data.customers?.phone} />
                            <FieldRow label="Place of Supply" value={data.supply_place || data.customers?.supply_place} />
                            <FieldRow label="State Code" value={d.state_code} />
                        </div>
                    </div>
                </div>

                {/* PRODUCTS TABLE */}
                <div className="relative">
                    <table className="w-full table-fixed border-collapse border border-black text-[8px]">
                    <thead>
                        <tr className="bg-gray-200 text-[8px] font-black uppercase text-gray-800">
                            <th className="w-[4%] border border-black px-1 py-1.5 text-center">#</th>
                            <th className="w-[30%] border border-black px-1 py-1.5 text-left">Item Name</th>
                            <th className="w-[10%] border border-black px-1 py-1.5 text-center">HSN/SAC</th>
                            <th className="w-[6%] border border-black px-1 py-1.5 text-center">Qty</th>
                            <th className="w-[6%] border border-black px-1 py-1.5 text-center">Unit</th>
                            <th className="w-[9%] border border-black px-1 py-1.5 text-right">Rate</th>
                            {hasAnyDiscount && (
                                <th className="w-[8%] border border-black px-1 py-1.5 text-center">{hasPercentDiscount ? 'Disc%' : 'Disc'}</th>
                            )}
                            {!allGstIsZero && (
                                <th className="w-[7%] border border-black px-1 py-1.5 text-center">GST%</th>
                            )}
                            {!allGstIsZero && (
                                <th className="w-[9%] border border-black px-1 py-1.5 text-right">Tax Amt</th>
                            )}
                            <th className="w-[11%] border border-black px-1 py-1.5 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const gstItem = item as GstItem
                            return (
                                <tr key={index} className="break-inside-avoid odd:bg-white even:bg-gray-50">
                                    <td className="border border-black px-1 py-1 text-center font-bold">{index + 1}</td>
                                    <td className="border border-black px-1 py-1 leading-tight">
                                        <p className="font-bold break-words">{item.item_name || item.name}</p>
                                        {item.description && (
                                            <p className="break-words text-[7px] leading-tight text-gray-600">{item.description}</p>
                                        )}
                                    </td>
                                    <td className="border border-black px-1 py-1 text-center">{item.hsn_code || '—'}</td>
                                    <td className="border border-black px-1 py-1 text-center">{item.quantity}</td>
                                    <td className="border border-black px-1 py-1 text-center">{gstItem.unit || 'Nos'}</td>
                                    <td className="border border-black px-1 py-1 text-right">
                                        {fmtMoney(item.unit_price || item.rate || 0)}
                                    </td>
                                    {hasAnyDiscount && (
                                        <td className="border border-black px-1 py-1 text-center">
                                            {item.discount_type === 'percent'
                                                ? `${(item.discount_rate ?? item.discount ?? 0)}%`
                                                : (item.discount || 0) > 0
                                                ? fmtMoney(item.discount || 0)
                                                : '—'}
                                        </td>
                                    )}
                                    {!allGstIsZero && (
                                        <td className="border border-black px-1 py-1 text-center">{item.tax_rate ?? 18}%</td>
                                    )}
                                    {!allGstIsZero && (
                                        <td className="border border-black px-1 py-1 text-right">{fmtMoney(item.tax_amount || 0)}</td>
                                    )}
                                    <td className="border border-black px-1 py-1 text-right font-black">{fmtMoney(item.total)}</td>
                                </tr>
                            )
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={10} className="border border-black px-2 py-3 text-center text-[9px] text-gray-500">
                                    No items
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                    {profile?.logo_url && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center select-none">
                            <img
                                src={profile.logo_url}
                                alt=""
                                className="h-44 w-72 max-h-full max-w-full -rotate-12 object-contain opacity-[0.08]"
                            />
                        </div>
                    )}
                </div>

                {/* BOTTOM SECTIONS */}
                <div className="mt-1 grid grid-cols-12 gap-3">
                    {/* LEFT: TAX BREAKDOWN + BANK + NOTES */}
                    <div className="col-span-7 space-y-3">
                        {!allGstIsZero && totalTaxAmt > 0 && (
                            <div className="border border-black break-inside-avoid">
                                <SectionHeading>Tax Breakdown</SectionHeading>
                                <table className="w-full table-fixed border-collapse text-[9px]">
                                    <thead>
                                        <tr className="bg-gray-200 text-[8px] font-black uppercase text-gray-800">
                                            <th className="w-[15%] border-b border-r border-black px-2 py-1 text-left">GST Rate</th>
                                            <th className="w-[25%] border-b border-r border-black px-2 py-1 text-right">Taxable</th>
                                            {isIgstInvoice ? (
                                                <th className="w-[20%] border-b border-r border-black px-2 py-1 text-right">IGST</th>
                                            ) : (
                                                <>
                                                    <th className="w-[20%] border-b border-r border-black px-2 py-1 text-right">CGST</th>
                                                    <th className="w-[20%] border-b border-r border-black px-2 py-1 text-right">SGST</th>
                                                </>
                                            )}
                                            <th className="w-[20%] border-b border-black px-2 py-1 text-right">Total Tax</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxGroupsList.map(group => (
                                            <tr key={group.rate} className="border-b border-gray-200">
                                                <td className="border-r border-black px-2 py-1 font-bold">{group.rate}%</td>
                                                <td className="border-r border-black px-2 py-1 text-right">{fmtMoney(group.taxable)}</td>
                                                {isIgstInvoice ? (
                                                    <td className="border-r border-black px-2 py-1 text-right">{fmtMoney(group.tax)}</td>
                                                ) : (
                                                    <>
                                                        <td className="border-r border-black px-2 py-1 text-right">{fmtMoney(group.tax / 2)}</td>
                                                        <td className="border-r border-black px-2 py-1 text-right">{fmtMoney(group.tax / 2)}</td>
                                                    </>
                                                )}
                                                <td className="px-2 py-1 text-right font-bold">{fmtMoney(group.tax)}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-black">
                                            <td colSpan={isIgstInvoice ? 2 : 3} className="border-r border-black px-2 py-1 text-right uppercase">Total</td>
                                            <td className="px-2 py-1 text-right">{fmtMoney(totalTaxAmt)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {settings.show_bank_details && bankDetails && (
                            <div className="border border-black">
                                <SectionHeading>Bank Details</SectionHeading>
                                <div className="space-y-1 p-2">
                                    <FieldRow label="Bank Name" value={bankDetails.bank_branch_name} />
                                    <FieldRow label="Account Holder" value={bankDetails.account_holder_name} />
                                    <FieldRow label="Account Number" value={bankDetails.account_number} />
                                    <FieldRow label="IFSC" value={bankDetails.ifsc_code} />
                                    <FieldRow label="UPI ID" value={bankDetails.upi_id} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {data.notes && (
                                <div className="border border-black">
                                    <SectionHeading>Notes</SectionHeading>
                                    <p className="whitespace-pre-wrap px-2 py-1 text-[8px] leading-relaxed">{data.notes}</p>
                                </div>
                            )}

                            {settings.show_terms && (
                                <div className="border border-black">
                                    <SectionHeading>Terms &amp; Conditions</SectionHeading>
                                    <div className="space-y-1 px-2 py-1 text-[8px] leading-relaxed">
                                        {profile?.terms_and_conditions ? (
                                            <ul className="list-disc pl-4">
                                                {profile.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
                                                    <li key={i}>{term.trim()}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>1. Goods once sold will not be taken back.</p>
                                        )}
                                        {warrantyItems.length > 0 && (
                                            <div className="pt-1">
                                                <p className="font-black uppercase">Warranty Details:</p>
                                                <ul className="list-disc pl-4">
                                                    {warrantyItems.map((item, i) => (
                                                        <li key={i}>
                                                            <span className="font-bold">{item.item_name || item.name}:</span> {item.warranty}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="border border-black">
                                <SectionHeading>Declaration</SectionHeading>
                                <p className="px-2 py-1 text-[8px] leading-relaxed">
                                    We declare that this {isInvoice ? 'invoice' : 'quotation'} shows the actual price of the goods described
                                    and that all particulars are true and correct.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: TOTALS + WORDS + SIGNATURE */}
                    <div className="col-span-5">
                        <table className="w-full table-fixed border-collapse border border-black">
                            <tbody>
                                <TotalRow label="Subtotal" value={fmtMoney(data.subtotal || 0)} />
                                {discountAmount > 0 && (
                                    <TotalRow
                                        label={`Discount${data.general_discount_type === 'percent' ? ` (${discount}%)` : ''}`}
                                        value={`-${fmtMoney(discountAmount)}`}
                                    />
                                )}
                                {!allGstIsZero && <TotalRow label="Taxable Amount" value={fmtMoney(taxableAmount)} borderTop />}
                                {effCgst > 0 && <TotalRow label="CGST" value={fmtMoney(effCgst)} />}
                                {effSgst > 0 && <TotalRow label="SGST" value={fmtMoney(effSgst)} />}
                                {effIgst > 0 && <TotalRow label="IGST" value={fmtMoney(effIgst)} />}
                                {cess > 0 && <TotalRow label="CESS" value={fmtMoney(cess)} />}
                                {additional > 0 && <TotalRow label="Additional Charges" value={fmtMoney(additional)} />}
                                {transport > 0 && <TotalRow label="Transport" value={fmtMoney(transport)} />}
                                {installation > 0 && <TotalRow label="Installation" value={fmtMoney(installation)} />}
                                {roundOff !== 0 && <TotalRow label="Round Off" value={fmtMoney(roundOff)} />}
                                <TotalRow label={isInvoice ? 'Invoice Total' : 'Quotation Total'} value={fmtMoney(computedInvoiceTotal)} borderTop bold />
                                {received > 0 && <TotalRow label="Received" value={fmtMoney(received)} />}
                            </tbody>
                        </table>

                        <div className="mt-2 border border-black bg-gray-100 px-2 py-1">
                            <p className="text-[7px] font-black uppercase tracking-widest text-gray-600">
                                {isInvoice ? 'Invoice Amount (in words)' : 'Quotation Amount (in words)'}
                            </p>
                            <p className="text-[9px] font-bold uppercase leading-snug">
                                {amountToWords(grandTotal)} Only
                            </p>
                        </div>

                        <div className="mt-4 border-t-2 border-black pt-1 text-right">
                            <p className="text-[11px] font-black uppercase">Grand Total</p>
                            <p className="text-2xl font-black leading-none">{fmtMoney(grandTotal)}</p>
                        </div>

                        {settings.show_signature && (
                            <div className="mt-20 flex flex-col items-end pr-2">
                                {profile?.signature_url && (
                                    <div className="relative mb-1 h-12 w-40">
                                        <img
                                            src={profile.signature_url}
                                            alt="Signature"
                                            className="h-full w-full object-contain object-right"
                                        />
                                    </div>
                                )}
                                <div className="w-56 border-t border-black pt-1 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest">Authorized Signatory</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-gray-300 pt-2"></div>
            </div>
        </div>
    )
}
