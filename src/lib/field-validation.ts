'use client'

export function validateRequired(value: unknown, label: string): string | null {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return `Please enter the ${label.toLowerCase()}.`
    }
    if (Array.isArray(value) && value.length === 0) {
        return `Please add at least one ${label.toLowerCase()}.`
    }
    if (typeof value === 'number' && isNaN(value)) {
        return `Please enter a valid ${label.toLowerCase()}.`
    }
    return null
}

export function validateEmail(value: string): string | null {
    const email = value.trim()
    if (!email) return null
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Please enter a valid email address.'
    }
    return null
}

export function validatePhone(value: string): string | null {
    const phone = value.trim()
    if (!phone) return null
    const digits = phone.replace(/[^\d]/g, '')
    if (digits.length < 10 || digits.length > 15) {
        return 'Please enter a valid mobile number (10-15 digits).'
    }
    return null
}

export function validateGSTIN(value: string): string | null {
    const gstin = value.trim().toUpperCase()
    if (!gstin) return null
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        return 'GSTIN must follow the 15-character format (e.g. 27AABCU9603R1ZM).'
    }
    return null
}

export function validatePinCode(value: string): string | null {
    const pin = value.trim()
    if (!pin) return null
    if (!/^\d{6}$/.test(pin)) {
        return 'PIN code must be 6 digits.'
    }
    return null
}

export function validatePositiveNumber(value: number | string | undefined | null, label: string): string | null {
    if (value === undefined || value === null || value === '') return null
    const num = typeof value === 'number' ? value : Number(value)
    if (isNaN(num)) return `Please enter a valid ${label.toLowerCase()}.`
    if (num < 0) return `${label} cannot be negative.`
    return null
}

export function capitalizeWords(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
        .join(' ')
}

export function sanitizePhoneInput(value: string): string {
    return value.replace(/[^\d+\s()-]/g, '')
}

export function sanitizeNumericInput(value: string): string {
    return value.replace(/[^\d.]/g, '')
}
