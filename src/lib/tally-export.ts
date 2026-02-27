/**
 * Tally XML Export Utility
 * Generates Tally-compatible XML files that can be directly imported
 * into Tally ERP 9 / Tally Prime using the "Import Data" feature.
 *
 * This exports Sales Vouchers, Purchase Vouchers, and Ledger Masters
 * in the standard Tally XML format.
 */

interface TallyVoucher {
    date: string          // DD-Mon-YYYY format (e.g. 27-Feb-2026)
    voucherNumber: string
    partyName: string
    ledgerName: string    // Sales / Purchase ledger
    amount: number
    gstAmount: number
    gstRate: number
    narration?: string
    voucherType: 'Sales' | 'Purchase' | 'Receipt' | 'Payment'
}

interface TallyLedger {
    name: string
    parent: string        // e.g. "Sundry Debtors", "Sales Accounts"
    gstNumber?: string
    state?: string
}

function formatTallyDate(dateStr: string): string {
    const d = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const day = d.getDate().toString().padStart(2, '0')
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${year}${(d.getMonth() + 1).toString().padStart(2, '0')}${day}`
}

function formatDisplayDate(dateStr: string): string {
    const d = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function generateLedgerXml(ledgers: TallyLedger[]): string {
    return ledgers.map(l => `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <LEDGER NAME="${escapeXml(l.name)}" ACTION="Create">
                <NAME.LIST>
                    <NAME>${escapeXml(l.name)}</NAME>
                </NAME.LIST>
                <PARENT>${escapeXml(l.parent)}</PARENT>
                ${l.gstNumber ? `<PARTYGSTIN>${escapeXml(l.gstNumber)}</PARTYGSTIN>` : ''}
                ${l.state ? `<LEDSTATENAME>${escapeXml(l.state)}</LEDSTATENAME>` : ''}
                <ISBILLWISEON>Yes</ISBILLWISEON>
                <AFFECTSSTOCK>No</AFFECTSSTOCK>
            </LEDGER>
        </TALLYMESSAGE>`).join('\n')
}

function generateVoucherXml(vouchers: TallyVoucher[]): string {
    return vouchers.map(v => {
        const tallyDate = formatTallyDate(v.date)
        const displayDate = formatDisplayDate(v.date)
        const netAmount = v.amount - v.gstAmount

        return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create">
                <DATE>${tallyDate}</DATE>
                <NARRATION>${escapeXml(v.narration || `${v.voucherType} Voucher - ${v.voucherNumber}`)}</NARRATION>
                <VOUCHERTYPENAME>${v.voucherType}</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${escapeXml(v.voucherNumber)}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${escapeXml(v.partyName)}</PARTYLEDGERNAME>
                <EFFECTIVEDATE>${tallyDate}</EFFECTIVEDATE>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(v.partyName)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? '' : '-'}${v.amount.toFixed(2)}</AMOUNT>
                    <BILLALLOCATIONS.LIST>
                        <NAME>${escapeXml(v.voucherNumber)}</NAME>
                        <BILLTYPE>New Ref</BILLTYPE>
                        <AMOUNT>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? '' : '-'}${v.amount.toFixed(2)}</AMOUNT>
                    </BILLALLOCATIONS.LIST>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(v.ledgerName)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? '-' : ''}${netAmount.toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                ${v.gstAmount > 0 ? `
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>CGST</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? '-' : ''}${(v.gstAmount / 2).toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>SGST</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>${v.voucherType === 'Sales' || v.voucherType === 'Receipt' ? '-' : ''}${(v.gstAmount / 2).toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>` : ''}
            </VOUCHER>
        </TALLYMESSAGE>`
    }).join('\n')
}

export function generateTallyXml(
    vouchers: TallyVoucher[],
    ledgers: TallyLedger[],
    companyName: string
): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
${generateLedgerXml(ledgers)}
${generateVoucherXml(vouchers)}
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`
}

export function downloadTallyXml(xml: string, fileName: string) {
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export type { TallyVoucher, TallyLedger }
