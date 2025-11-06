import type { IncomingHttpHeaders } from "http";

const SENSITIVE_KEYS = [
    'password', 'pass', 'pwd',
    'token', 'access_token', 'refresh_token',
    'authorization', 'auth', 'secret',
    'creditCard', 'cc', 'cardNumber'
];

const SENSITIVE_KEY_PATTERNS: RegExp[] = [
    /pass(word|wd)?/i,
    /token/i,
    /auth(orizat?ion)?/i,
    /api[_-]?key/i,
    /secret/i,
    /\bkey$/i,
    /session|cookie/i,
    /otp|mfa|two[_-]?factor|recovery/i,
    /card|ccnum|cvv|cvc|pan/i,
    /iban|routing|account.*number|acct/i,
    /ssn|social.*security|national[_-]?id|passport|driver/i,
    /private[_-]?key|ssh|pem|cert|certificate/i,
    /aws|aws_secret|aws_access|accesskey|secretaccesskey/i
];

function isSensitiveKey(key: string) {
    if(!key) return false;
    const normalized = key.toString().toLocaleLowerCase();
    if(SENSITIVE_KEYS.includes(normalized)) return true;
    
    for(const p of SENSITIVE_KEY_PATTERNS) {
        if(p.test(key)) return true;
    }

    return false;
}

export function sanitizeObject(obj: any, maxLen = 1000): any {
    if(!obj || typeof obj !== 'object') {
        const s = String(obj ?? '');
        return s.length > maxLen ? s.slice(0, maxLen) + '... (truncated)': s;
    }

    const out: any = Array.isArray(obj) ? [] : {};
    for(const [k,v] of Object.entries(obj)) {
        try {
            if(isSensitiveKey(k)) {
                out[k] = '[REDACTED]';
                continue;
            }

            if(typeof v === 'string') {
                out[k] = v.length > maxLen ? v.slice(0, maxLen) + '... (truncated)': v;
            } else if(typeof v === 'object') {
                out[k] = sanitizeObject(v, Math.floor(maxLen/2));
            } else {
                out[k] = v;
            }
        } catch {
            out[k] = '[unserializable]';
        }
    }
    return out;
}

export function extractClientInfo(headers: IncomingHttpHeaders) {
    return {
        userAgent: headers['user-agent'],
        forwardedFor: headers['x-forwarded-for'] || headers['x-real-ip'],
    };
}