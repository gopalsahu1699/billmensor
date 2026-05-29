/**
 * EAN-13 Barcode Utility
 * Generates, validates, and renders EAN-13 barcodes as SVG.
 */

// EAN-13 encoding patterns for left-side digits (odd positions)
const LEFT_ODD: string[] = [
    '0001101', '0011001', '0010011', '0111101', '0100011',
    '0110001', '0101111', '0111011', '0110111', '0001011'
];

// EAN-13 encoding patterns for left-side digits (even positions)
const LEFT_EVEN: string[] = [
    '0100111', '0110011', '0011011', '0100001', '0011101',
    '0111001', '0000101', '0010001', '0001001', '0010111'
];

// EAN-13 encoding patterns for right-side digits
const RIGHT: string[] = [
    '1110010', '1100110', '1101100', '1000010', '1011100',
    '1001110', '1010000', '1000100', '1001000', '1110100'
];

const GUARD = '101';
const CENTER = '01010';

/**
 * Generate a valid EAN-13 barcode number.
 * Uses India country code '890' as default prefix.
 */
export function generateEAN13(prefix: string = '890'): string {
    // Ensure prefix is numeric and doesn't exceed 12 digits
    const cleanPrefix = prefix.replace(/\D/g, '').slice(0, 12);

    // Pad with random digits to make 12 characters
    let code = cleanPrefix;
    while (code.length < 12) {
        code += Math.floor(Math.random() * 10).toString();
    }

    // Calculate check digit
    const checkDigit = calculateCheckDigit(code);
    return code + checkDigit;
}

/**
 * Calculate the EAN-13 check digit.
 * 1. Sum digits in odd positions (1st, 3rd, 5th...) * 1
 * 2. Sum digits in even positions (2nd, 4th, 6th...) * 3
 * 3. Total = sum1 + sum2
 * 4. Check digit = (10 - (total % 10)) % 10
 */
export function calculateCheckDigit(code: string): number {
    const digits = code.split('').map(Number);
    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < digits.length; i++) {
        if (i % 2 === 0) {
            sum1 += digits[i];
        } else {
            sum2 += digits[i];
        }
    }

    const total = sum1 * 1 + sum2 * 3;
    return (10 - (total % 10)) % 10;
}

/**
 * Validate an EAN-13 barcode by checking its check digit.
 */
export function validateEAN13(code: string): boolean {
    if (!/^\d{13}$/.test(code)) return false;

    const inputCheckDigit = Number(code[12]);
    const expectedCheckDigit = calculateCheckDigit(code.slice(0, 12));
    return inputCheckDigit === expectedCheckDigit;
}

/**
 * Render an EAN-13 barcode as an SVG string.
 * Each digit maps to a pattern of vertical bars.
 */
export function renderBarcodeSVG(
    code: string,
    options: {
        width?: number;
        height?: number;
        showText?: boolean;
        backgroundColor?: string;
        barColor?: string;
    } = {}
): string {
    const {
        width = 200,
        height = 120,
        showText = true,
        backgroundColor = '#ffffff',
        barColor = '#000000'
    } = options;

    if (!/^\d{13}$/.test(code)) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect width="${width}" height="${height}" fill="${backgroundColor}" />
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="12" fill="red">Invalid EAN-13</text>
        </svg>`;
    }

    // Build the binary pattern
    let binary = GUARD; // Start guard

    // First digit determines left-side encoding pattern
    const firstDigit = Number(code[0]);
    const leftPattern = getLeftPattern(firstDigit);

    // Encode left 6 digits (positions 1-6)
    for (let i = 1; i <= 6; i++) {
        const digit = Number(code[i]);
        const pattern = leftPattern[i - 1] === 'O' ? LEFT_ODD[digit] : LEFT_EVEN[digit];
        binary += pattern;
    }

    binary += CENTER; // Center guard

    // Encode right 6 digits (positions 7-12)
    for (let i = 7; i <= 12; i++) {
        const digit = Number(code[i]);
        binary += RIGHT[digit];
    }

    binary += GUARD; // End guard

    // Calculate SVG dimensions
    const moduleWidth = width / binary.length;
    const barcodeHeight = showText ? height - 25 : height;
    const yStart = 0;

    // Build SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`;

    // Draw bars
    for (let i = 0; i < binary.length; i++) {
        if (binary[i] === '1') {
            const x = i * moduleWidth;
            svg += `<rect x="${x}" y="${yStart}" width="${moduleWidth}" height="${barcodeHeight}" fill="${barColor}" />`;
        }
    }

    // Add text below
    if (showText) {
        const textY = barcodeHeight + 15;
        svg += `<text x="50%" y="${textY}" text-anchor="middle" font-family="monospace" font-size="12" fill="${barColor}">${code}</text>`;
    }

    svg += '</svg>';
    return svg;
}

/**
 * Get the left-side encoding pattern based on the first digit.
 * Returns 'O' for odd encoding and 'E' for even encoding for each of the 6 left positions.
 */
function getLeftPattern(firstDigit: number): string[] {
    const patterns: string[][] = [
        ['O', 'O', 'O', 'O', 'O', 'O'], // 0
        ['O', 'O', 'E', 'O', 'E', 'E'], // 1
        ['O', 'O', 'E', 'E', 'O', 'E'], // 2
        ['O', 'O', 'E', 'E', 'E', 'O'], // 3
        ['O', 'E', 'O', 'O', 'E', 'E'], // 4
        ['O', 'E', 'E', 'O', 'O', 'E'], // 5
        ['O', 'E', 'E', 'E', 'O', 'O'], // 6
        ['O', 'E', 'O', 'E', 'O', 'E'], // 7
        ['O', 'E', 'O', 'E', 'E', 'O'], // 8
        ['O', 'E', 'E', 'O', 'E', 'O'], // 9
    ];
    return patterns[firstDigit] || patterns[0];
}
