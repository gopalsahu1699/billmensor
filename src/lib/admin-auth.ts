import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function safeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = failedAttempts.get(ip);
    if (!entry) return false;
    if (now > entry.resetAt) {
        failedAttempts.delete(ip);
        return false;
    }
    return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(ip: string): void {
    const now = Date.now();
    const entry = failedAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
        entry.count += 1;
    }
}

function recordSuccess(ip: string): void {
    failedAttempts.delete(ip);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return false;
    return safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

export function isAdminRequest(req: Request): boolean {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false;
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
        return false;
    }

    const base64Credentials = authHeader.split(' ')[1];
    let credentials: string;
    try {
        credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    } catch {
        recordFailure(ip);
        return false;
    }

    const [username, password] = credentials.split(':');
    if (!username || !password) {
        recordFailure(ip);
        return false;
    }

    const ok = verifyAdminCredentials(username, password);
    if (ok) {
        recordSuccess(ip);
    } else {
        recordFailure(ip);
    }
    return ok;
}
