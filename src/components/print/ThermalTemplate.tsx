import React from 'react'
import { PrintTemplateProps } from '@/types/print'

export function ThermalTemplate({
    data,
    profile,
    items,
    type
}: PrintTemplateProps) {

    const isInvoice = type === 'invoice'
    const companyName = (profile?.company_name || 'Company').toUpperCase()
    const docNumber = isInvoice ? data.invoice_number : data.quotation_number
    const docDate = new Date(
        (isInvoice ? data.invoice_date : data.quotation_date) || new Date()
    ).toLocaleDateString('en-IN')

    return (
        <div
            className="bg-white mx-auto text-black"
            style={{
                fontFamily: "'Courier New', monospace",
                width: '300px',
                fontSize: '11px',
                lineHeight: '1.4',
                padding: '8px',
            }}
        >
            {/* CUT LINE */}
            <div style={{ borderTop: '1px dashed #000', marginBottom: '8px' }}></div>

            {/* COMPANY NAME */}
            <div className="text-center mb-2">
                <p className="font-bold text-[14px]">{companyName}</p>
                {profile?.address && (
                    <p className="text-[9px]">{profile.address.toUpperCase()}</p>
                )}
                {profile?.phone && (
                    <p className="text-[9px]">PH: {profile.phone}</p>
                )}
                {profile?.gstin && (
                    <p className="text-[9px]">GSTIN: {profile.gstin}</p>
                )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

            {/* DOC INFO */}
            <div className="text-[10px] mb-2">
                <div className="flex justify-between">
                    <span>{isInvoice ? 'INVOICE' : 'ESTIMATE'}:</span>
                    <span className="font-bold">{docNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{docDate}</span>
                </div>
                {isInvoice && (
                    <div className="flex justify-between">
                        <span>STATUS:</span>
                        <span className="font-bold">{((data.payment_status === 'draft' ? 'unpaid' : data.payment_status === 'partially_paid' ? 'partially paid' : data.payment_status) || 'UNPAID').toUpperCase()}</span>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

            {/* CUSTOMER */}
            {data.customers?.name && (
                <div className="text-[10px] mb-2">
                    <p className="font-bold">NAME: {data.customers.name.toUpperCase()}</p>
                    {(data.billing_phone || data.customers?.billing_phone || data.customers?.phone) && (
                        <p>PH: {data.billing_phone || data.customers?.billing_phone || data.customers?.phone}</p>
                    )}
                </div>
            )}

            {/* ITEMS */}
            <div className="mb-2">
                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
                <div className="flex justify-between text-[9px] font-bold mb-1">
                    <span>ITEM</span>
                    <span>AMOUNT</span>
                </div>
                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

                {items.map((item, index) => (
                    <div key={index} className="text-[10px] mb-2 break-inside-avoid">
                        <div className="flex justify-between">
                            <span className="font-bold">{(item.item_name || item.name || 'ITEM').toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                            <span>{item.quantity} x ₹{(item.unit_price || item.rate || 0).toFixed(2)}</span>
                            <span className="font-bold">₹{item.total.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

            {/* TOTALS */}
            <div className="text-[10px] space-y-1 mb-2">
                <div className="flex justify-between">
                    <span>SUBTOTAL</span>
                    <span>₹{(data.subtotal || 0).toFixed(2)}</span>
                </div>
                {data.discount > 0 && (
                    <div className="flex justify-between">
                        <span>DISC {data.general_discount_type === 'percent' ? `(${data.discount}%)` : ''}</span>
                        <span>{data.general_discount_type === 'percent' ? `-${data.discount}%` : `-₹${(data.discount || 0).toFixed(2)}`}</span>
                    </div>
                )}
                {(data.tax_total || data.gst_amount || 0) > 0 && (
                    <div className="flex justify-between">
                        <span>GST</span>
                        <span>₹{(data.tax_total || data.gst_amount || 0).toFixed(2)}</span>
                    </div>
                )}
                {(data.transport_charges || 0) > 0 && (
                    <div className="flex justify-between">
                        <span>TRANSPORT</span>
                        <span>₹{(data.transport_charges || 0).toFixed(2)}</span>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

            {/* GRAND TOTAL */}
            <div className="flex justify-between text-[13px] font-bold mb-2">
                <span>TOTAL</span>
                <span>₹{(data.total_amount || 0).toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

            {/* THANK YOU */}
            <div className="text-center text-[10px] mt-3 mb-1">
                <p className="font-bold">THANK YOU!</p>
                <p className="text-[9px]">VISIT AGAIN</p>
            </div>

            {/* CUT LINE */}
            <div style={{ borderTop: '1px dashed #000', marginTop: '8px' }}></div>
        </div>
    )
}
