const ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
]

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
    if (n < 20) return ONES[n]
    const ten = Math.floor(n / 10)
    const one = n % 10
    return TENS[ten] + (one ? ` ${ONES[one]}` : '')
}

function threeDigits(n: number): string {
    const hundred = Math.floor(n / 100)
    const rest = n % 100
    let out = ''
    if (hundred) out += `${ONES[hundred]} Hundred`
    if (rest) out += (out ? ' ' : '') + twoDigits(rest)
    return out
}

export function amountToWords(amount: number): string {
    const safe = Math.abs(Math.round(Number(amount || 0) * 100) / 100)
    const [rupeePart, paisePart] = safe.toFixed(2).split('.')
    const rupees = parseInt(rupeePart, 10)
    const paise = parseInt(paisePart, 10)

    const crore = Math.floor(rupees / 10000000)
    const lakh = Math.floor((rupees % 10000000) / 100000)
    const thousand = Math.floor((rupees % 100000) / 1000)
    const hundred = rupees % 1000

    let words = ''
    if (crore) words += `${threeDigits(crore)} Crore`
    if (lakh) words += (words ? ' ' : '') + `${twoDigits(lakh)} Lakh`
    if (thousand) words += (words ? ' ' : '') + `${twoDigits(thousand)} Thousand`
    if (hundred) words += (words ? ' ' : '') + threeDigits(hundred)

    let result = (words || 'Zero') + ' Rupees'
    if (paise) result += ` and ${twoDigits(paise)} Paise`
    return result
}
