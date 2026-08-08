export const WARRANTY_HEADER = 'Warranty Details'

export interface TermsItem {
    name?: string
    warranty?: string | null
}

/**
 * Builds the full terms & conditions text for an invoice/quotation by combining
 * the account-level common terms with per-product warranty details.
 */
export function buildTermsAndConditions(commonTerms: string, items: TermsItem[]): string {
    const lines: string[] = []

    const base = commonTerms?.trim() || ''
    if (base) lines.push(base)

    const warrantyItems = items.filter(item => item.warranty && item.warranty.trim())
    if (warrantyItems.length > 0) {
        if (lines.length > 0) lines.push('')
        lines.push(`${WARRANTY_HEADER}:`)
        warrantyItems.forEach(item => {
            lines.push(`${item.name || 'Item'}: ${item.warranty!.trim()}`)
        })
    }

    return lines.join('\n')
}

/**
 * Updates only the warranty section of an existing terms text, preserving any
 * text before the warranty header (common terms and manual edits).
 */
export function syncWarrantySection(current: string, items: TermsItem[]): string {
    const warrantyItems = items.filter(item => item.warranty && item.warranty.trim())
    const lines = current.split('\n')
    const headerIndex = lines.findIndex(line => line.trim() === `${WARRANTY_HEADER}:`)

    let base: string
    if (headerIndex >= 0) {
        base = lines.slice(0, headerIndex).join('\n').replace(/\s+$/, '')
    } else {
        base = current.replace(/\s+$/, '')
    }

    if (warrantyItems.length === 0) {
        return base
    }

    const warrantyLines = [
        ...(base ? [base] : []),
        '',
        `${WARRANTY_HEADER}:`,
        ...warrantyItems.map(item => `${item.name || 'Item'}: ${item.warranty!.trim()}`)
    ]
    return warrantyLines.join('\n')
}
