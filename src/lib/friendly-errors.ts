'use client'

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.'

interface FriendlyMatch {
    pattern: RegExp
    message: string
}

const KNOWN_PATTERNS: FriendlyMatch[] = [
    { pattern: /invalid login credentials/i, message: 'Incorrect email or password. Please try again.' },
    { pattern: /email not confirmed/i, message: 'Please verify your email address before signing in.' },
    { pattern: /too many (requests|attempts)|rate limit|failed to validate/i, message: 'Too many attempts. Please wait a few minutes and try again.' },
    { pattern: /coupon limit reached/i, message: 'This coupon has reached its usage limit.' },
    { pattern: /coupon.*(expired|invalid|not found)/i, message: 'This coupon is invalid or has expired.' },
    { pattern: /new row violates row-level security policy|row-level security policy|permission denied/i, message: 'You don\u2019t have permission to perform this action.' },
    { pattern: /duplicate key value violates unique constraint "([^"]+)"/, message: 'A record with this value already exists. Please use a different one.' },
    { pattern: /duplicate key value violates unique constraint/i, message: 'A record with this value already exists. Please use a different one.' },
    { pattern: /null value in column "([^"]+)" violates not-null constraint/i, message: 'Please fill in all required fields before saving.' },
    { pattern: /violates foreign key constraint/i, message: 'This record is linked to other records and cannot be changed.' },
    { pattern: /violates check constraint/i, message: 'The value you entered is not allowed for this field.' },
    { pattern: /fetch failed|failed to fetch|network error|network request failed|temporal/i, message: 'Network error. Please check your connection and try again.' },
    { pattern: /not authenticated|auth\/session-missing|no user/i, message: 'Your session has expired. Please sign in again.' },
    { pattern: /invalid api key|apikey|jwt expired/i, message: 'Your session has expired. Please refresh the page and try again.' },
]

export function friendlyError(err: unknown, fallback: string = DEFAULT_FALLBACK): string {
    if (!err) return fallback

    const raw = typeof err === 'string'
        ? err
        : err instanceof Error
            ? err.message
            : typeof (err as { message?: unknown })?.message === 'string'
                ? (err as { message: string }).message
                : ''

    if (!raw) return fallback

    for (const { pattern, message } of KNOWN_PATTERNS) {
        if (pattern.test(raw)) return message
    }

    return fallback
}

export function extractErrorMessage(err: unknown): string {
    if (!err) return ''
    if (typeof err === 'string') return err
    if (err instanceof Error) return err.message
    if (typeof (err as { message?: unknown })?.message === 'string') {
        return (err as { message: string }).message
    }
    return ''
}
